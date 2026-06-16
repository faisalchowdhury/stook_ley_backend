import mongoose, { Schema } from "mongoose";
import { INotary } from "./notary.interface";

const NotarySchema = new Schema<INotary>(
  {
    companyName: { type: String, required: true },
    website: { type: String, required: true },
    location: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    image: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const NotaryModel =
  mongoose.models.Notary || mongoose.model<INotary>("Notary", NotarySchema);
