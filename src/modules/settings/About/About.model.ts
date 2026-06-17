import mongoose, { Schema } from "mongoose";
import { IAbout } from "./About.interface";

const AboutSchema = new Schema<IAbout>(
  {
    description: { type: String, required: true },
    countriesServed: { type: Number, default: 15 },
    activeUsers: { type: String, default: "50k+" },
    industryAwards: { type: Number, default: 12 },
  },
  { timestamps: true },
);

export const AboutModel =
  mongoose.models.About || mongoose.model<IAbout>("About", AboutSchema);
