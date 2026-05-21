import { BucketStatusModel } from "./bucketStatus.model";
import { IBucketStatus } from "./bucketStatus.interface";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createStatus = async (payload: Partial<IBucketStatus>) => {
  return await BucketStatusModel.create(payload);
};

const getAllStatuses = async () => {
  return await BucketStatusModel.find({ isDeleted: false });
};

const updateStatus = async (id: string, payload: Partial<IBucketStatus>) => {
  const result = await BucketStatusModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Status not found");
  }
  return result;
};

const deleteStatus = async (id: string) => {
  const result = await BucketStatusModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Status not found");
  }
  return result;
};

export const BucketStatusService = {
  createStatus,
  getAllStatuses,
  updateStatus,
  deleteStatus,
};
