import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BucketCategoryService } from "./bucketCategory.service";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { categoryName, slug } = req.body;

  if (!categoryName || !slug) {
    throw new ApiError(httpStatus.BAD_REQUEST, "categoryName and slug are required");
  }

  const result = await BucketCategoryService.createCategory({ categoryName, slug });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await BucketCategoryService.getAllCategories();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Categories retrieved successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BucketCategoryService.updateCategory(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BucketCategoryService.deleteCategory(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
});

export const BucketCategoryController = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
