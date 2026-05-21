import { BucketCategoryModel } from "./bucketCategory.model";
import { IBucketCategory } from "./bucketCategory.interface";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createCategory = async (payload: Partial<IBucketCategory>) => {
  return await BucketCategoryModel.create(payload);
};

const getAllCategories = async () => {
  return await BucketCategoryModel.find({ isDeleted: false });
};

const updateCategory = async (id: string, payload: Partial<IBucketCategory>) => {
  const result = await BucketCategoryModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  return result;
};

const deleteCategory = async (id: string) => {
  const result = await BucketCategoryModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  return result;
};

export const BucketCategoryService = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
