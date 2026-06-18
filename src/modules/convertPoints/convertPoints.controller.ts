import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { ConvertPointsModel } from "./convertPoints.model";

const create = catchAsync(async (req: Request, res: Response) => {
  const { userId, email, solana_wallet_address, amount } = req.body;

  // Manual Validation
  if (!userId || !email || !solana_wallet_address || amount === undefined) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "userId, email, solana_wallet_address and amount are required",
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "amount must be a positive number");
  }

  const result = await ConvertPointsModel.create({
    userId,
    email,
    solana_wallet_address,
    amount,
    status: "pending",
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Convert points request submitted successfully",
    data: result,
  });
});

export const ConvertPointsController = { create };
