import { Document, Types } from "mongoose";

export interface IChildren extends Document {
  userId: Types.ObjectId;
  name: string;
  gender: string;
  isDeleted: boolean;
}
