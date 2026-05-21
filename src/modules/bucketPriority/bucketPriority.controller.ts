import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BucketPriorityService } from "./bucketPriority.service";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";

const createPriority = catchAsync(async (req: Request, res: Response) => {
  const { priorityName, slug } = req.body;

  if (!priorityName || !slug) {
    throw new ApiError(httpStatus.BAD_REQUEST, "priorityName and slug are required");
  }

  const result = await BucketPriorityService.createPriority({ priorityName, slug });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Priority created successfully",
    data: result,
  });
});

const getAllPriorities = catchAsync(async (req: Request, res: Response) => {
  const result = await BucketPriorityService.getAllPriorities();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Priorities retrieved successfully",
    data: result,
  });
});

const updatePriority = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BucketPriorityService.updatePriority(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Priority updated successfully",
    data: result,
  });
});

const deletePriority = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BucketPriorityService.deletePriority(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Priority deleted successfully",
    data: result,
  });
});

export const BucketPriorityController = {
  createPriority,
  getAllPriorities,
  updatePriority,
  deletePriority,
};
