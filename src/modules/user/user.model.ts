import { UserController } from "../user/user.controller";
import mongoose, { Schema } from "mongoose";
import { IUser, IOTP } from "./user.interface";
import { ERole } from "../../config/role";
import { string } from "zod";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, index: true },
    address: { type: String },

    password: { type: String, required: false },
    role: {
      type: String,
      enum: ["admin", "user", "executor", "authorizer"],
      default: "user",
    },
    type: {
      type: String,
      enum: ["apple", "default"],
      default: "default",
    },
    fcmToken: { type: String, required: false },
    profilePicture: { type: String, required: false },
    isVerified: { type: Boolean, required: true, default: false },
    isDeleted: { type: Boolean, required: true, default: false },
    isDeath: { type: Boolean, required: true, default: false },
    deathReport: {
      reportedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reportTime: { type: Date },
      isPending: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1, role: 1 }, { unique: true });

export const UserModel = mongoose.model<IUser>("User", userSchema);

// userSchema.index({ name: "text" });
// UserSchema.index({ createdAt: 1 });
// UserModel.schema.index({ role: 1 });

const OTPSchema = new Schema<IOTP>({
  email: { type: String, required: true, trim: true, index: true },
  otp: { type: String, required: true, trim: true },
  expiresAt: { type: Date, required: true, index: { expires: "1m" } },
});

export const OTPModel = mongoose.model<IOTP>("OTP", OTPSchema);
OTPSchema.index({ email: 1, expiresAt: 1 });
