import { IKeeper } from "./keeper.interface";
import { KeeperModel } from "./keeper.model";
import { sendAssignedNotify, hashPassword } from "../user/user.utils";
import { UserModel } from "../user/user.model";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import mongoose from "mongoose";

const assignKeeper = async (userId: string, payload: IKeeper) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Allowed multiple keepers for the same role per user request
  // (Previously there was a check here that blocked duplicates)

  const existingEmail = await KeeperModel.findOne({
    userId,
    email: payload.email,
    isDeleted: false,
  });

  if (existingEmail) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "A keeper with this email is already assigned",
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
  return await KeeperModel.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "users",
        let: { keeperEmail: "$email", keeperRole: "$role" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$email", "$$keeperEmail"] },
                  { $eq: ["$role", "$$keeperRole"] },
                  { $eq: ["$isDeleted", false] },
                ],
              },
            },
          },
          {
            $project: {
              password: 0,
              __v: 0,
            },
          },
        ],
        as: "accountDetails",
      },
    },
    {
      $unwind: {
        path: "$accountDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
};

const getSingleKeeper = async (id: string, userId: string) => {
  const result = await KeeperModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "users",
        let: { keeperEmail: "$email", keeperRole: "$role" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$email", "$$keeperEmail"] },
                  { $eq: ["$role", "$$keeperRole"] },
                  { $eq: ["$isDeleted", false] },
                ],
              },
            },
          },
          {
            $project: {
              password: 0,
              __v: 0,
            },
          },
        ],
        as: "accountDetails",
      },
    },
    {
      $unwind: {
        path: "$accountDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "Keeper not found or not authorized");
  }
  return result[0];
};

const updateKeeper = async (id: string, userId: string, payload: Partial<IKeeper>) => {
  if (payload.email) {
    const existingEmail = await KeeperModel.findOne({
      _id: { $ne: id },
      userId,
      email: payload.email,
      isDeleted: false,
    });

    if (existingEmail) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "A keeper with this email is already assigned",
      );
    }
  }

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

const getAssignedToMe = async (userEmail: string) => {
  return await KeeperModel.aggregate([
    {
      $match: {
        email: userEmail,
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "assignedByUser",
      },
    },
    {
      $unwind: "$assignedByUser",
    },
    {
      $project: {
        role: 1, // My role for that user
        assignedByUser: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          profilePicture: 1,
          address: 1,
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
};

export const KeeperService = {
  assignKeeper,
  getMyKeepers,
  getSingleKeeper,
  updateKeeper,
  deleteKeeper,
  getAssignedToMe,
};
