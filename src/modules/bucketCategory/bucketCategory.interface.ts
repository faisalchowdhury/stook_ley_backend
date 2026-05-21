import { Document } from "mongoose";

export interface IBucketCategory extends Document {
  categoryName: string;
  slug: string;
  isDeleted: boolean;
}
