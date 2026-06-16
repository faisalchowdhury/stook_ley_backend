import { ChildrenModel } from "./children.model";
import { IChildren } from "./children.interface";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createChild = async (payload: Partial<IChildren>) => {
  return await ChildrenModel.create(payload);
};

const createMultipleChildren = async (userId: string, children: any[]) => {
  const childrenWithUserId = children.map((child) => ({
    ...child,
    userId,
  }));
  return await ChildrenModel.insertMany(childrenWithUserId);
};

const getMyChildren = async (userId: string) => {
  return await ChildrenModel.find({ userId, isDeleted: false });
};

const getSingleChild = async (id: string, userId: string) => {
  const result = await ChildrenModel.findOne({ _id: id, userId, isDeleted: false });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Child not found");
  }
  return result;
};

const updateChild = async (id: string, userId: string, payload: Partial<IChildren>) => {
  const result = await ChildrenModel.findOneAndUpdate(
    { _id: id, userId, isDeleted: false },
    payload,
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Child not found");
  }
  return result;
};

const deleteChild = async (id: string, userId: string) => {
  const result = await ChildrenModel.findOneAndUpdate(
    { _id: id, userId, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Child not found");
  }
  return result;
};

export const ChildrenService = {
  createChild,
  createMultipleChildren,
  getMyChildren,
  getSingleChild,
  updateChild,
  deleteChild,
};
