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
  password: string | null;
  role: string;
  type: "apple" | "default";
  fcmToken?: string;
  profilePicture: string;
  address: string;
  isVerified: boolean;
  isDeleted: boolean;
  isDeath: boolean;
  deathReport?: {
    reportedBy: Types.ObjectId;
    reportTime: Date;
    isPending: boolean;
  };
}
export type IOTP = {
  email: string;
  otp: string;
  expiresAt: Date;
} & Document;
