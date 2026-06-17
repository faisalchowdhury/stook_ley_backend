import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { RewardConfigModel } from "./rewardConfig.model";

const getAll = catchAsync(async (req: Request, res: Response) => {
  const configs = await RewardConfigModel.find().sort({ createdAt: 1 });

  // Seed defaults if empty
  if (configs.length === 0) {
    const defaults = ["WhatsApp", "Facebook", "Twitter/X", "Instagram", "LinkedIn", "TikTok"];
    const seeded = await RewardConfigModel.insertMany(
      defaults.map((p) => ({ platform: p, pointsReward: 500, status: "active" })),
    );
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Reward configs seeded and retrieved",
      data: seeded,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reward configs retrieved successfully",
    data: configs,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { pointsReward, status } = req.body;

  const config = await RewardConfigModel.findByIdAndUpdate(
    id,
    { ...(pointsReward !== undefined && { pointsReward }), ...(status && { status }) },
    { new: true },
  );

  if (!config) {
    throw new ApiError(httpStatus.NOT_FOUND, "Reward config not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reward config updated successfully",
    data: config,
  });
});

export const RewardConfigController = { getAll, update };
