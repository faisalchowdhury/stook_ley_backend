import mongoose, { Schema, Document } from "mongoose";

export interface IRewardConfig extends Document {
  platform: string;
  pointsReward: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const RewardConfigSchema = new Schema<IRewardConfig>(
  {
    platform: { type: String, required: true, unique: true },
    pointsReward: { type: Number, required: true, default: 500 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

export const RewardConfigModel =
  mongoose.models.RewardConfig ||
  mongoose.model<IRewardConfig>("RewardConfig", RewardConfigSchema);
