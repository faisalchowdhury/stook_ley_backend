import { Document } from "mongoose";

export interface IBucketStatus extends Document {
  statusName: string;
  slug: string;
  isDeleted: boolean;
}
