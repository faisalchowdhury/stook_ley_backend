import { BucketListModel } from "./bucketList.model";
import { IBucketList } from "./bucketList.interface";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createBucketItem = async (payload: Partial<IBucketList>) => {
  return await BucketListModel.create(payload);
};

const getMyBucketList = async (userId: string) => {
  return await BucketListModel.find({ userId, isDeleted: false })
    .populate("categoryId")
    .populate("priorityId")
    .populate("statusId");
};

const getSingleBucketItem = async (id: string, userId: string) => {
  const result = await BucketListModel.findOne({ _id: id, userId, isDeleted: false })
    .populate("categoryId")
    .populate("priorityId")
    .populate("statusId");
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Bucket item not found");
  }
  return result;
};

const updateBucketItem = async (id: string, userId: string, payload: Partial<IBucketList>) => {
  const result = await BucketListModel.findOneAndUpdate(
    { _id: id, userId, isDeleted: false },
    payload,
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Bucket item not found");
  }
  return result;
};

const deleteBucketItem = async (id: string, userId: string) => {
  const result = await BucketListModel.findOneAndUpdate(
    { _id: id, userId, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Bucket item not found");
  }
  return result;
};

export const BucketListService = {
  createBucketItem,
  getMyBucketList,
  getSingleBucketItem,
  updateBucketItem,
  deleteBucketItem,
};
