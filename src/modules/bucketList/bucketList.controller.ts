import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BucketListService } from "./bucketList.service";
import { BucketCategoryModel } from "../bucketCategory/bucketCategory.model";
import { BucketPriorityModel } from "../bucketPriority/bucketPriority.model";
import { BucketStatusModel } from "../bucketStatus/bucketStatus.model";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { IUserPayload } from "../../middlewares/roleGuard";

const createBucketItem = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    categoryId,
    description,
    priorityId,
    statusId,
    targetDate,
    note,
  } = req.body;

  // Manual Validation
  if (
    !title ||
    !categoryId ||
    !description ||
    !priorityId ||
    !statusId ||
    !targetDate
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Title, categoryId, description, priorityId, statusId, and targetDate are required",
    );
  }

  // Validate IDs existence
  const [category, priority, status] = await Promise.all([
    BucketCategoryModel.findOne({ _id: categoryId, isDeleted: false }),
    BucketPriorityModel.findOne({ _id: priorityId, isDeleted: false }),
    BucketStatusModel.findOne({ _id: statusId, isDeleted: false }),
  ]);

  if (!category) throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  if (!priority) throw new ApiError(httpStatus.NOT_FOUND, "Priority not found");
  if (!status) throw new ApiError(httpStatus.NOT_FOUND, "Status not found");

  const user = req.user as IUserPayload;
  const payload: any = {
    userId: user.id,
    title,
    categoryId,
    description,
    priorityId,
    statusId,
    targetDate,
    note,
  };

  if (req.file) {
    payload.photo = `/images/${req.file.filename}`;
  }

  const result = await BucketListService.createBucketItem(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Bucket item created successfully",
    data: result,
  });
});

const getMyBucketList = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const result = await BucketListService.getMyBucketList(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bucket list retrieved successfully",
    data: result,
  });
});

const getSingleBucketItem = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { id } = req.params;
  const result = await BucketListService.getSingleBucketItem(id, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bucket item retrieved successfully",
    data: result,
  });
});

const updateBucketItem = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { id } = req.params;
  const payload = { ...req.body };

  if (req.file) {
    payload.photo = `/images/${req.file.filename}`;
  }

  const result = await BucketListService.updateBucketItem(id, user.id, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bucket item updated successfully",
    data: result,
  });
});

const deleteBucketItem = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { id } = req.params;
  const result = await BucketListService.deleteBucketItem(id, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bucket item deleted successfully",
    data: result,
  });
});

export const BucketListController = {
  createBucketItem,
  getMyBucketList,
  getSingleBucketItem,
  updateBucketItem,
  deleteBucketItem,
};
