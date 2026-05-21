import { Document } from "mongoose";

export interface IBucketPriority extends Document {
  priorityName: string;
  slug: string;
  isDeleted: boolean;
}
