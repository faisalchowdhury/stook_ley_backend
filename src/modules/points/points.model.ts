import mongoose, { Schema } from "mongoose";
import { IPoints } from "./points.interface";

const PointsSchema = new Schema<IPoints>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    point: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const PointsModel =
  mongoose.models.Points || mongoose.model<IPoints>("Points", PointsSchema);
