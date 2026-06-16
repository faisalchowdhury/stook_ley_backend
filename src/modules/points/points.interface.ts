import { Document, Types } from "mongoose";

export interface IPoints extends Document {
  userId: Types.ObjectId;
  point: number;
}
