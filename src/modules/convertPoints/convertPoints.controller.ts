import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { UserModel } from "../user/user.model";
import { PointsService } from "../points/points.service";
import { sendConvertPointsAdminNotification, sendConvertPointsStatusEmail } from "../user/user.utils";
import { ConvertPointsService } from "./convertPoints.service";

const create = catchAsync(async (req: Request, res: Response) => {
  const { userId, email, solana_wallet_address, amount } = req.body;

  if (!userId || !email || !solana_wallet_address || amount === undefined) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "userId, email, solana_wallet_address and amount are required",
    );
  }

  // ownership check to prevent IDOR (Insecure Direct Object Reference)
  if ((req as any).user?.id !== userId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not authorized to convert points for another user",
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "amount must be a positive number");
  }

  const user = await UserModel.findOne({
    _id: userId,
    isDeleted: { $ne: true },
  }).select("name email");

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
  }

  const result = await ConvertPointsService.createRequest({
    userId,
    email,
    solana_wallet_address,
    amount,
  });

  const pointsAfterRequest = await PointsService.getMyPoints(userId);

  try {
    const admins = await UserModel.find({
      role: "admin",
      isDeleted: { $ne: true },
    }).select("email");

    const adminEmails = admins.map((admin) => admin.email).filter(Boolean);

    await sendConvertPointsAdminNotification(adminEmails, {
      userName: user.name,
      userEmail: email,
      amount,
      walletAddress: solana_wallet_address,
      requestId: String(result._id),
    });
  } catch (emailError) {
    console.error("Convert points admin notification failed:", emailError);
  }

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message:
      "Convert points request submitted successfully. Points have been reserved from your account.",
    data: {
      request: result,
      remainingPoints: pointsAfterRequest.point ?? 0,
    },
  });
});

const getAllRequests = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  if (status && !["pending", "approved", "rejected"].includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "status must be pending, approved, or rejected",
    );
  }

  const result = await ConvertPointsService.getAllRequests({
    page,
    limit,
    status,
    search,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Convert points requests retrieved successfully",
    data: {
      requests: result.requests,
      pagination: result.pagination,
    },
  });
});

const getRequestById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const request = await ConvertPointsService.getRequestById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Convert points request retrieved successfully",
    data: request,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["approved", "rejected"].includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "status must be approved or rejected",
    );
  }

  const updated = await ConvertPointsService.updateRequestStatus(id, status);

  try {
    const user = updated?.userId as { name?: string; email?: string } | null;
    const recipientEmail = user?.email || updated?.email;
    const recipientName = user?.name || "User";

    if (recipientEmail && updated) {
      await sendConvertPointsStatusEmail({
        name: recipientName,
        email: recipientEmail,
        status,
        amount: updated.amount,
        walletAddress: updated.solana_wallet_address,
        requestId: String(updated._id),
      });
    }
  } catch (emailError) {
    console.error("Convert points status email failed:", emailError);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Convert points request ${status} successfully`,
    data: updated,
  });
});

export const ConvertPointsController = {
  create,
  getAllRequests,
  getRequestById,
  updateStatus,
};
