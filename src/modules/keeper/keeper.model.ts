import mongoose, { Schema } from "mongoose";
import { IKeeper } from "./keeper.interface";

const keeperSchema = new Schema<IKeeper>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["executor", "authorizer"],
      required: true,
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    relation: { type: String, required: true },
    contactNumber: { type: String, required: true },
    devicePassword: { type: String },
    appPin: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

keeperSchema.index({ userId: 1, email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const KeeperModel = mongoose.model<IKeeper>("Keeper", keeperSchema);
