import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PointsService } from "./points.service";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { IUserPayload } from "../../middlewares/roleGuard";
import { UserModel } from "../user/user.model";
import { sendPointsAssignedEmail } from "../user/user.utils";

const updatePoints = catchAsync(async (req: Request, res: Response) => {
  const { amount, action } = req.body;

  // Manual Validation
  if (amount === undefined || !action) {
    throw new ApiError(httpStatus.BAD_REQUEST, "amount and action are required");
  }

  if (typeof amount !== "number") {
    throw new ApiError(httpStatus.BAD_REQUEST, "amount must be a number");
  }

  if (!["plus", "minus"].includes(action)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "action must be 'plus' or 'minus'");
  }

  const user = req.user as IUserPayload;
  const result = await PointsService.updatePoints(user.id, amount, action);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Points ${action === "plus" ? "added" : "subtracted"} successfully`,
    data: result,
  });
});

const getMyPoints = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const result = await PointsService.getMyPoints(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Points retrieved successfully",
    data: result,
  });
});

const adminAssignPoints = catchAsync(async (req: Request, res: Response) => {
  const { userId, points, amount, reason } = req.body;
  const pointsToAdd = points ?? amount;

  if (!userId || pointsToAdd === undefined) {
    throw new ApiError(httpStatus.BAD_REQUEST, "userId and points are required");
  }

  if (typeof pointsToAdd !== "number" || pointsToAdd <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "points must be a positive number");
  }

  const user = await UserModel.findOne({
    _id: userId,
    isDeleted: { $ne: true },
  }).select("_id name email");

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
  }

  const result = await PointsService.assignPointsToUser(userId, pointsToAdd);

  try {
    await sendPointsAssignedEmail({
      name: user.name,
      email: user.email,
      assignedPoints: result.assignedPoints,
      previousPoints: result.previousPoints,
      totalPoints: result.totalPoints,
      reason: reason ?? null,
    });
  } catch (emailError) {
    console.error("Points assigned email failed:", emailError);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${pointsToAdd} points assigned successfully`,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      previousPoints: result.previousPoints,
      assignedPoints: result.assignedPoints,
      totalPoints: result.totalPoints,
      reason: reason ?? null,
    },
  });
});

const getUsersWithPoints = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const { name, email, role } = req.query;

  const result = await PointsService.getUsersWithPoints({
    skip,
    limit,
    name: name as string | undefined,
    email: email as string | undefined,
    role: role as string | undefined,
  });

  if (result.users.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "No users with points found.",
      data: [],
      pagination: {
        ...result.pagination,
        prevPage: result.pagination.prevPage ?? 0,
        nextPage: result.pagination.nextPage ?? 0,
      },
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users with points retrieved successfully",
    data: result.users,
    pagination: {
      ...result.pagination,
      prevPage: result.pagination.prevPage ?? 0,
      nextPage: result.pagination.nextPage ?? 0,
    },
  });
});

export const PointsController = {
  updatePoints,
  getMyPoints,
  adminAssignPoints,
  getUsersWithPoints,
};
