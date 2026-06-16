import { Document } from "mongoose";

export interface INotary extends Document {
  companyName: string;
  website: string;
  location: string;
  email: string;
  phone: string;
  image: string;
  isDeleted: boolean;
}
