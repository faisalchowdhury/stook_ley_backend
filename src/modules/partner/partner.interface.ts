import { Document, Types } from "mongoose";

export interface IPartner extends Document {
  userId: Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  isDeleted: boolean;
}
