import { Types } from "mongoose";

export interface IKeeper {
  userId: Types.ObjectId;
  role: "executor" | "authorizer";
  fullName: string;
  email: string;
  relation: string;
  contactNumber: string;
  devicePassword?: string;
  appPin?: string;
  isDeleted: boolean;
}
