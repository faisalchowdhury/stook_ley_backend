import { IUser } from "./user.interface";
import "dotenv/config";

import { Twilio } from "twilio";

import { OTPModel, UserModel } from "./user.model";
import crypto from "crypto";
import ApiError from "../../errors/ApiError";

import { findUserByEmail, generateOTP, hashPassword } from "./user.utils";

import httpStatus from "http-status";
import { generateToken, verifyToken } from "../../utils/JwtToken";

import { TRole } from "../../config/role";
import paginationBuilder from "../../utils/paginationBuilder";
import mongoose, { Types } from "mongoose";
import {
  twilioAccountSid,
  twilioAuthToken,
  twilioPhoneNumber,
} from "../../config";

import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { NotificationModel } from "../notifications/notification.model";
import { KeeperModel } from "../keeper/keeper.model";
import { sendPushNotificationToMultiple } from "../notifications/pushNotification/pushNotification.controller";

/**
 * Create a DB notification for a single user and send them a push (if they
 * have an fcmToken). Push failures are swallowed so they never break the flow.
 */
const notifyUser = async (
  userId: Types.ObjectId | string | undefined,
  title: string,
  body: string,
) => {
  if (!userId) return;

  await NotificationModel.create({
    userId,
    userMsgTittle: title,
    userMsg: body,
  });

  const recipient = await UserModel.findById(userId).select("fcmToken");
  if (recipient?.fcmToken) {
    await sendPushNotificationToMultiple([recipient.fcmToken], {
      title,
      body,
    }).catch((err) => console.error("Push notification error:", err));
  }
};

/**
 * Notify all of an owner's executors and authorizers (keepers).
 * Keeper records are linked to a real User account by email + role; we resolve
 * those accounts to create a DB notification and collect their FCM tokens.
 */
const notifyKeepers = async (
  ownerUserId: Types.ObjectId | string,
  title: string,
  body: string,
) => {
  const keepers = await KeeperModel.find({
    userId: ownerUserId,
    isDeleted: false,
  });

  const tokens: string[] = [];

  for (const keeper of keepers) {
    const account = await UserModel.findOne({
      email: keeper.email,
      role: keeper.role,
    }).select("_id fcmToken");

    if (!account) continue;

    await NotificationModel.create({
      userId: account._id,
      userMsgTittle: title,
      userMsg: body,
    });

    if (account.fcmToken) tokens.push(account.fcmToken);
  }

  if (tokens.length > 0) {
    await sendPushNotificationToMultiple(tokens, { title, body }).catch((err) =>
      console.error("Push notification error:", err),
    );
  }
};

/**
 * Updates a user by ID.
 */
const updateUserById = async (
  id: string,
  updateData: Partial<IUser>,
): Promise<IUser | null> => {
  return UserModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    },
  );
};

/**
 * Soft-deletes a user and anonymizes their email.
 */
const userDelete = async (id: string, email: string): Promise<void> => {
  const baseDeletedEmail = `deleted-account-${email}`;
  let deletedEmail = baseDeletedEmail;
  for (
    let counter = 1;
    await UserModel.exists({ email: deletedEmail });
    counter++
  ) {
    deletedEmail = `${baseDeletedEmail}-${counter}`;
  }
  await UserModel.findByIdAndUpdate(id, {
    isDeleted: true,
    email: deletedEmail,
  });
};

/**
 * Verifies OTP for forgot password flow and returns a new token if valid.
 */
const verifyForgotPasswordOTPService = async (email: string, otp: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }
  const otpRecord = await OTPModel.findOne({ email });
  if (!otpRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, "OTP record not found!");
  }
  const currentTime = new Date();
  if (otpRecord.expiresAt < currentTime) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP has expired");
  }
  if (otpRecord.otp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Wrong OTP");
  }
  const userId = user._id as string;
  const token = generateToken({
    id: userId,
    role: user.role,
    email: user.email,
  });
  return { token };
};

/**
 * Gets a paginated list of admin users.
 */
const getAdminList = async (
  skip: number,
  limit: number,
  name?: string,
): Promise<{
  admins: IUser[];
  pagination: ReturnType<typeof paginationBuilder>;
}> => {
  const query: any = {
    isDeleted: { $ne: true },
    role: { $in: ["primary", "secondary", "junior"] },
  };
  if (name) {
    query.name = { $regex: name, $options: "i" };
  }
  const pipeline: any[] = [
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        image: 1,
        name: 1,
        role: 1,
        email: 1,
        createdAt: 1,
        phone: 1,
        address: 1,
        _id: 1,
      },
    },
  ];
  const admins = await UserModel.aggregate(pipeline);
  const totalAdmins = await UserModel.countDocuments(query);
  const currentPage = Math.floor(skip / limit) + 1;
  const pagination = paginationBuilder({
    totalData: totalAdmins,
    currentPage,
    limit,
  });
  return { admins, pagination };
};

/**
 * Gets a paginated list of non-admin users with optional filters.
 */
const getUserList = async (
  skip: number,
  limit: number,
  date?: string,
  name?: string,
  email?: string,
  role?: string,
  requestStatus?: string,
): Promise<{
  users: IUser[];
  pagination: ReturnType<typeof paginationBuilder>;
}> => {
  const query: any = {
    $and: [{ isDeleted: { $ne: true } }, { role: { $nin: ["admin"] } }],
  };
  if (date) {
    const [year, month, day] = date.split("-").map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    query.createdAt = { $gte: startDate, $lte: endDate };
  }
  if (name) query.name = { $regex: name, $options: "i" };
  if (role) query.role = { $regex: role, $options: "i" };
  if (requestStatus) {
    query.isRequest = { $regex: requestStatus, $options: "i" };
  }
  const pipeline: any[] = [
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        image: 1,
        name: 1,
        email: 1,
        role: 1,
        createdAt: 1,
        phone: 1,
        address: 1,
        isRequest: 1,
        managerInfoId: 1,
        _id: 1,
      },
    },
  ];
  const users = (await UserModel.aggregate(pipeline)) as IUser[];
  const totalUsers = await UserModel.countDocuments(query);
  const currentPage = Math.floor(skip / limit) + 1;
  const pagination = paginationBuilder({
    totalData: totalUsers,
    currentPage,
    limit,
  });
  return { users, pagination };
};

const verifyOTPService = async (otp: string, authorizationHeader: string) => {
  let decoded: JwtPayloadWithUser;

  try {
    decoded = verifyToken(authorizationHeader) as JwtPayloadWithUser;

    console.log(decoded);
  } catch (error: any) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
  }

  const email = decoded.email as string;

  const dbOTP = await OTPModel.findOne({ email });
  if (!dbOTP || dbOTP.otp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  const token = generateToken({
    id: user._id,
    role: user.role,
    email: user.email,
  });

  return {
    token,
    name: user.name,
    email: user.email,
  };
};

const client = new Twilio(twilioAccountSid, twilioAuthToken);

const sendSMS = async (to: string, body: string): Promise<void> => {
  try {
    await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
    });
  } catch (error: any) {
    console.log(`Failed to send SMS to ${to}: ${error.message}`);
    throw error;
  }
};

const sendPhoneVerification = async (
  to: string,
  otp: string,
): Promise<void> => {
  try {
    const message = `Your verification code is ${otp}`;
    await sendSMS(to, message);
  } catch (err) {
    console.log(err);
  }
};

const sendResetPasswordSMS = async (to: string, otp: number): Promise<void> => {
  const message = `Your password reset code is ${otp}`;
  await sendSMS(to, message);
};

const finalizeDeathStatus = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (user && user.deathReport?.isPending) {
    const reportTime = user.deathReport.reportTime!;
    const now = new Date();
    const hoursPassed = (now.getTime() - reportTime.getTime()) / (1000 * 60 * 60);

    if (hoursPassed >= 24) {
      await UserModel.findByIdAndUpdate(userId, {
        isDeath: true,
        "deathReport.isPending": false,
      });

      // Notify all executors and authorizers that there was no response in 24h
      await notifyKeepers(
        userId,
        "Death Report Finalized",
        `The death report for ${user.name} has been finalized after 24 hours of no response.`,
      );
    }
  }
};

/**
 * Sweep all users with a pending death report and finalize any whose 24h
 * window has elapsed. Run periodically by the scheduler (node-cron) so that
 * finalization survives server restarts (unlike an in-process setTimeout).
 */
const sweepPendingDeathReports = async () => {
  const pendingUsers = await UserModel.find({
    "deathReport.isPending": true,
  }).select("_id");

  for (const pending of pendingUsers) {
    await finalizeDeathStatus(String(pending._id)).catch((err) =>
      console.error("Error finalizing death status:", err),
    );
  }
};

const reportDeath = async (reporterId: string, userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.isDeath) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User is already marked as deceased");
  }

  if (user.deathReport?.isPending) {
    throw new ApiError(httpStatus.BAD_REQUEST, "A death report is already pending for this user");
  }

  const result = await UserModel.findByIdAndUpdate(
    userId,
    {
      deathReport: {
        reportedBy: new Types.ObjectId(reporterId),
        reportTime: new Date(),
        isPending: true,
      },
    },
    { new: true },
  );

  // Notify the user (DB + push) to respond within 24h
  await notifyUser(
    userId,
    "Critical: Death Report Received",
    "A death report has been submitted for your account. If you are alive, please respond within 24 hours to decline this report, or your account will be marked as deceased.",
  );

  // Finalization is handled by the scheduled sweep (see scheduler / cron),
  // which marks the account deceased once 24h elapse with no response.

  return result;
};

const respondToDeathReport = async (userId: string, isAlive: boolean) => {
  const user = await UserModel.findById(userId);
  if (!user || !user.deathReport?.isPending) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No pending death report found");
  }

  if (isAlive) {
    // Decline the report
    const result = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: { "deathReport.isPending": false },
        $unset: { "deathReport.reportedBy": 1, "deathReport.reportTime": 1 },
      },
      { new: true },
    );

    // Notify all executors and authorizers that the user declined the report
    await notifyKeepers(
      userId,
      "Death Report Declined",
      `${user.name} has responded and declined the death report.`,
    );

    return result;
  } else {
    // Manually confirming death
    const result = await UserModel.findByIdAndUpdate(
      userId,
      {
        isDeath: true,
        "deathReport.isPending": false,
      },
      { new: true },
    );
    return result;
  }
};

const UserService = {
  updateUserById,
  userDelete,
  verifyForgotPasswordOTPService,
  getAdminList,
  getUserList,
  verifyOTPService,
  sendPhoneVerification,
  sendResetPasswordSMS,
  sendSMS,
  reportDeath,
  respondToDeathReport,
  finalizeDeathStatus,
  sweepPendingDeathReports,
};

export { UserService };
