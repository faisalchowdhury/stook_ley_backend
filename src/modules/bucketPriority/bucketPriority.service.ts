import { BucketPriorityModel } from "./bucketPriority.model";
import { IBucketPriority } from "./bucketPriority.interface";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createPriority = async (payload: Partial<IBucketPriority>) => {
  return await BucketPriorityModel.create(payload);
};

const getAllPriorities = async () => {
  return await BucketPriorityModel.find({ isDeleted: false });
};

const updatePriority = async (id: string, payload: Partial<IBucketPriority>) => {
  const result = await BucketPriorityModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Priority not found");
  }
  return result;
};

const deletePriority = async (id: string) => {
  const result = await BucketPriorityModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Priority not found");
  }
  return result;
};

export const BucketPriorityService = {
  createPriority,
  getAllPriorities,
  updatePriority,
  deletePriority,
};
