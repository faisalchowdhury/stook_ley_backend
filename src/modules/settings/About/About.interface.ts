import { Document } from "mongoose";

export type IAbout = {
  description: string;
  countriesServed: number;
  activeUsers: string;
  industryAwards: number;
} & Document;
