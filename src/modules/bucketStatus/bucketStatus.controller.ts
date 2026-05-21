import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BucketStatusService } from "./bucketStatus.service";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";

const createStatus = catchAsync(async (req: Request, res: Response) => {
  const { statusName, slug } = req.body;

  if (!statusName || !slug) {
    throw new ApiError(httpStatus.BAD_REQUEST, "statusName and slug are required");
  }

  const result = await BucketStatusService.createStatus({ statusName, slug });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Status created successfully",
    data: result,
  });
});

const getAllStatuses = catchAsync(async (req: Request, res: Response) => {
  const result = await BucketStatusService.getAllStatuses();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Statuses retrieved successfully",
    data: result,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BucketStatusService.updateStatus(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Status updated successfully",
    data: result,
  });
});

const deleteStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BucketStatusService.deleteStatus(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Status deleted successfully",
    data: result,
  });
});

export const BucketStatusController = {
  createStatus,
  getAllStatuses,
  updateStatus,
  deleteStatus,
};
