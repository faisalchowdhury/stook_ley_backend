import mongoose, { Schema } from "mongoose";
import { IBucketList } from "./bucketList.interface";

const BucketListSchema = new Schema<IBucketList>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "BucketCategory",
      required: true,
    },
    description: { type: String, required: true },
    priorityId: {
      type: Schema.Types.ObjectId,
      ref: "BucketPriority",
      required: true,
    },
    statusId: {
      type: Schema.Types.ObjectId,
      ref: "BucketStatus",
      required: true,
    },
    targetDate: { type: Date, required: true },
    photo: { type: String },
    note: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const BucketListModel =
  mongoose.models.BucketList ||
  mongoose.model<IBucketList>("BucketList", BucketListSchema);
