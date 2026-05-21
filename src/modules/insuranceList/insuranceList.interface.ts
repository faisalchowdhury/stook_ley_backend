import { Document } from "mongoose";

export interface IInsuranceList extends Document {
  name: string;
  description: string;
  company: string;
  websiteLink: string;
  image: string;
  location: string;
  isDeleted: boolean;
}
