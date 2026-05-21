import { Document, Types } from "mongoose";

export interface IUserInsurance extends Document {
  userId: Types.ObjectId;
  insuranceId: Types.ObjectId;
  provider: string;
  policyNumber: string;
  isDeleted: boolean;
}
