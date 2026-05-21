import { Document, Types } from "mongoose";

export interface IBucketList extends Document {
  userId: Types.ObjectId;
  title: string;
  categoryId: Types.ObjectId;
  description: string;
  priorityId: Types.ObjectId;
  statusId: Types.ObjectId;
  targetDate: Date;
  photo: string;
  note: string;
  isDeleted: boolean;
}
