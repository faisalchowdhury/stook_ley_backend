import mongoose, { Schema } from "mongoose";
import { IBucketStatus } from "./bucketStatus.interface";

const BucketStatusSchema = new Schema<IBucketStatus>(
  {
    statusName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const BucketStatusModel =
  mongoose.models.BucketStatus ||
  mongoose.model<IBucketStatus>("BucketStatus", BucketStatusSchema);
