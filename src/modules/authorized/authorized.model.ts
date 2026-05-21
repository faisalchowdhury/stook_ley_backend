import mongoose, { Schema } from "mongoose";
import { IAuthorized } from "./authorized.interface";

const authorizedSchema = new Schema<IAuthorized>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  part: {
    type: String,
    required: true,
    enum: ["authorized", "executor"],
  },
  password: {
    type: String,
    required: true,
  },
});

export const AuthorizedModel = mongoose.model<IAuthorized>(
  "Authorized",
  authorizedSchema,
);
