import { IKeeper } from "./keeper.interface";
import { KeeperModel } from "./keeper.model";
import { sendAssignedNotify, hashPassword } from "../user/user.utils";
import { UserModel } from "../user/user.model";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const assignKeeper = async (userId: string, payload: IKeeper) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const existingKeeper = await KeeperModel.findOne({
    userId,
    role: payload.role,
    isDeleted: false,
  });

  if (existingKeeper) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `You have already assigned an ${payload.role}`,
    );
  }

  if (payload.devicePassword) {
    payload.devicePassword = await hashPassword(payload.devicePassword);
  }
  if (payload.appPin) {
    payload.appPin = await hashPassword(payload.appPin);
  }

  const result = await KeeperModel.create({ ...payload, userId });

  if (result) {
    await sendAssignedNotify(
      payload.fullName,
      payload.email,
      payload.role,
      user.name,
    );
  }

  return result;
};

const getMyKeepers = async (userId: string) => {
  return await KeeperModel.find({ userId, isDeleted: false });
};

const getSingleKeeper = async (id: string, userId: string) => {
  const result = await KeeperModel.findOne({ _id: id, userId, isDeleted: false });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Keeper not found or not authorized");
  }
  return result;
};

const updateKeeper = async (id: string, userId: string, payload: Partial<IKeeper>) => {
  if (payload.devicePassword) {
    payload.devicePassword = await hashPassword(payload.devicePassword);
  }
  if (payload.appPin) {
    payload.appPin = await hashPassword(payload.appPin);
  }

  const result = await KeeperModel.findOneAndUpdate(
    { _id: id, userId, isDeleted: false },
    payload,
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Keeper not found or not authorized");
  }
  return result;
};

const deleteKeeper = async (id: string, userId: string) => {
  const result = await KeeperModel.findOneAndUpdate(
    { _id: id, userId, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Keeper not found or not authorized");
  }
  return result;
};

export const KeeperService = {
  assignKeeper,
  getMyKeepers,
  getSingleKeeper,
  updateKeeper,
  deleteKeeper,
};
