import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PointsService } from "./points.service";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { IUserPayload } from "../../middlewares/roleGuard";

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

export const PointsController = {
  updatePoints,
  getMyPoints,
};
