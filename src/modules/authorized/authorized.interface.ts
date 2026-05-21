import { Types } from "mongoose";

export interface IAuthorized {
  userId: Types.ObjectId;
  name: string;
  email: string;
  part: string;
  password: string;
}
