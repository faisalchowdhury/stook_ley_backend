import { Document, Types } from "mongoose";
import { TRole } from "../../config/role";

// export interface ILocation {
//   type: "Point";
//   coordinates: [number, number]; // [longitude, latitude]
// }

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  profilePicture: string;
  address: string;
  isVerified: boolean;
  isDeleted: boolean;
}
export type IOTP = {
  email: string;
  otp: string;
  expiresAt: Date;
} & Document;
