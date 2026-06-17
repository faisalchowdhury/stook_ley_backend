import { AboutModel } from "./About.model";

type AboutData = {
  sanitizedContent: string;
};

export const createAboutInDB = async (aboutData: AboutData) => {
  const newAbout = new AboutModel({ description: aboutData.sanitizedContent });
  const savedAbout = await newAbout.save();
  return savedAbout;
};

export const getAllAboutFromDB = async () => {
  const about = await AboutModel.find().sort({ createdAt: -1 });
  return about;
};

export const updateAboutInDB = async (newData: string, extras?: { countriesServed?: number; activeUsers?: string; industryAwards?: number }) => {
  const updatePayload: any = { description: newData };
  if (extras?.countriesServed !== undefined) updatePayload.countriesServed = extras.countriesServed;
  if (extras?.activeUsers !== undefined) updatePayload.activeUsers = extras.activeUsers;
  if (extras?.industryAwards !== undefined) updatePayload.industryAwards = extras.industryAwards;

  const updatedAbout = await AboutModel.findOneAndUpdate(
    {},
    updatePayload,
    { new: true, upsert: true },
  );

  return updatedAbout;
};
