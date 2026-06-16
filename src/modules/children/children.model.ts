import mongoose, { Schema } from "mongoose";
import { IChildren } from "./children.interface";

const ChildrenSchema = new Schema<IChildren>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    gender: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ChildrenModel =
  mongoose.models.Children || mongoose.model<IChildren>("Children", ChildrenSchema);
