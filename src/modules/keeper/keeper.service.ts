import { IKeeper } from "./keeper.interface";
import { KeeperModel } from "./keeper.model";
import { sendAssignedNotify } from "../user/user.utils";
import { UserModel } from "../user/user.model";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import mongoose from "mongoose";
import {
  encryptCredentialIfNeeded,
  resolveStoredCredential,
} from "../../utils/credentialEncryption";

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
    payload.devicePassword = encryptCredentialIfNeeded(payload.devicePassword);
  }
  if (payload.appPin) {
    payload.appPin = encryptCredentialIfNeeded(payload.appPin);
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
    payload.devicePassword = encryptCredentialIfNeeded(payload.devicePassword);
  }
  if (payload.appPin) {
    payload.appPin = encryptCredentialIfNeeded(payload.appPin);
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
  const assignments = await KeeperModel.aggregate([
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
        role: 1,
        fullName: 1,
        relation: 1,
        contactNumber: 1,
        executorAccessReleasedAt: 1,
        createdAt: 1,
        assignedByUser: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          profilePicture: 1,
          address: 1,
          isDeath: 1,
          deathReport: 1,
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return assignments.map((item) => {
    const owner = item.assignedByUser;
    const isPending = Boolean(owner?.deathReport?.isPending);
    const isDeath = Boolean(owner?.isDeath);
    const executorAccessReady = item.role === "executor" && isDeath;

    return {
      _id: item._id,
      role: item.role,
      fullName: item.fullName,
      relation: item.relation,
      contactNumber: item.contactNumber,
      executorAccessReleasedAt: item.executorAccessReleasedAt || null,
      assignedByUser: owner,
      deathStatus: {
        isDeath,
        isPending,
        safeMode: isDeath,
        reportTime: owner?.deathReport?.reportTime || null,
        status: isDeath
          ? "deceased_locked"
          : isPending
            ? "death_pending"
            : "active",
        executorAccessReady,
      },
    };
  });
};

const getExecutorCredentials = async (executorId: string) => {
  const executor = await UserModel.findOne({
    _id: executorId,
    role: "executor",
    isDeleted: false,
  }).select("email");

  if (!executor?.email) {
    return null;
  }

  const emailPattern = new RegExp(
    `^${executor.email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    "i",
  );

  const keeper = await KeeperModel.findOne({
    role: "executor",
    isDeleted: false,
    email: emailPattern,
  })
    .sort({ createdAt: -1 })
    .select("userId devicePassword appPin executorAccessReleasedAt");

  if (!keeper) {
    return null;
  }

  const owner = await UserModel.findOne({
    _id: keeper.userId,
    role: "user",
    isDeath: true,
    isDeleted: false,
  }).select("_id name email isDeath");

  if (!owner) {
    return null;
  }

  const devicePassword = resolveStoredCredential(keeper.devicePassword);
  const appPin = resolveStoredCredential(keeper.appPin);

  if (!keeper.executorAccessReleasedAt) {
    await KeeperModel.findByIdAndUpdate(keeper._id, {
      executorAccessReleasedAt: new Date(),
    });
  }

  return {
    assignedByUser: {
      _id: owner._id,
      name: owner.name,
      email: owner.email,
      isDeath: owner.isDeath,
    },
    devicePassword: devicePassword ?? null,
    appPin: appPin ?? null,
  };
};

const getExecutorAccess = async (
  ownerUserId: string,
  executorEmail: string,
) => {
  const owner = await UserModel.findById(ownerUserId).select(
    "name email phone isDeath deathReport",
  );
  if (!owner) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (!owner.isDeath) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Executor access is only available after the account has been confirmed deceased.",
    );
  }

  const keeper = await KeeperModel.findOne({
    userId: ownerUserId,
    email: executorEmail,
    role: "executor",
    isDeleted: false,
  });

  if (!keeper) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not assigned as an executor for this user.",
    );
  }

  const devicePassword = resolveStoredCredential(keeper.devicePassword);
  const appPin = resolveStoredCredential(keeper.appPin);

  if (
    keeper.devicePassword &&
    !devicePassword &&
    keeper.devicePassword.startsWith("enc:")
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Stored credentials cannot be retrieved. Please ask the account owner to re-assign the executor with updated device and app passwords.",
    );
  }

  if (!keeper.executorAccessReleasedAt) {
    await KeeperModel.findByIdAndUpdate(keeper._id, {
      executorAccessReleasedAt: new Date(),
    });
  }

  return {
    message: `Log in to the device of ${owner.name} using the details below:`,
    deceasedUser: {
      _id: owner._id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
    },
    status: "ready_for_executor_access",
    executorAccessReady: true,
    credentials: {
      devicePassword: devicePassword ?? null,
      appPin: appPin ?? null,
    },
    credentialsAvailable: Boolean(devicePassword && appPin),
    executorAccessReleasedAt: keeper.executorAccessReleasedAt || null,
  };
};

export const KeeperService = {
  assignKeeper,
  getMyKeepers,
  getSingleKeeper,
  updateKeeper,
  deleteKeeper,
  getAssignedToMe,
  getExecutorAccess,
  getExecutorCredentials,
};
