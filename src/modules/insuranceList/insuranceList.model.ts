import mongoose, { Schema } from "mongoose";
import { IInsuranceList } from "./insuranceList.interface";

const InsuranceListSchema = new Schema<IInsuranceList>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    company: { type: String, required: true },
    websiteLink: { type: String, required: true },
    image: { type: String, required: true },
    location: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const InsuranceListModel =
  mongoose.models.InsuranceList ||
  mongoose.model<IInsuranceList>("InsuranceList", InsuranceListSchema);
