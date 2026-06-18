import mongoose, { Schema, Document } from "mongoose";

export interface IConvertPoints extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  solana_wallet_address: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ConvertPointsSchema = new Schema<IConvertPoints>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    solana_wallet_address: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const ConvertPointsModel =
  mongoose.models.ConvertPoints ||
  mongoose.model<IConvertPoints>("ConvertPoints", ConvertPointsSchema);
