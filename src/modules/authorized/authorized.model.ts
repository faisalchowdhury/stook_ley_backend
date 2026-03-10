import mongoose, { Schema } from "mongoose";
import { IAuthorized } from "./authorized.interface";

const authorizedSchema = new Schema<IAuthorized>({
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
    enum: ["authorized", "executors"],
  },
});

export const AuthorizedModel = mongoose.model<IAuthorized>(
  "Authorized",
  authorizedSchema,
);
