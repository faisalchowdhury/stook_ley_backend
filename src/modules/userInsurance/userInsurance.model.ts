import mongoose, { Schema } from "mongoose";
import { IUserInsurance } from "./userInsurance.interface";

const UserInsuranceSchema = new Schema<IUserInsurance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    insuranceId: {
      type: Schema.Types.ObjectId,
      ref: "InsuranceList",
      required: true,
    },
    provider: { type: String, required: true },
    policyNumber: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const UserInsuranceModel =
  mongoose.models.UserInsurance ||
  mongoose.model<IUserInsurance>("UserInsurance", UserInsuranceSchema);
