import mongoose, { Schema } from "mongoose";
import { IBucketPriority } from "./bucketPriority.interface";

const BucketPrioritySchema = new Schema<IBucketPriority>(
  {
    priorityName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const BucketPriorityModel =
  mongoose.models.BucketPriority ||
  mongoose.model<IBucketPriority>("BucketPriority", BucketPrioritySchema);
