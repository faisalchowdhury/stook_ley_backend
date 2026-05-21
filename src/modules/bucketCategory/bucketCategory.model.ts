import mongoose, { Schema } from "mongoose";
import { IBucketCategory } from "./bucketCategory.interface";

const BucketCategorySchema = new Schema<IBucketCategory>(
  {
    categoryName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const BucketCategoryModel =
  mongoose.models.BucketCategory ||
  mongoose.model<IBucketCategory>("BucketCategory", BucketCategorySchema);
