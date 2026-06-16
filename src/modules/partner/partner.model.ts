import mongoose, { Schema } from "mongoose";
import { IPartner } from "./partner.interface";

const PartnerSchema = new Schema<IPartner>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const PartnerModel =
  mongoose.models.Partner || mongoose.model<IPartner>("Partner", PartnerSchema);
