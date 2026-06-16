import { PartnerModel } from "./partner.model";
import { IPartner } from "./partner.interface";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createPartner = async (payload: Partial<IPartner>) => {
  const existingPartner = await PartnerModel.findOne({ userId: payload.userId, isDeleted: false });
  if (existingPartner) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Partner already exists for this user");
  }
  return await PartnerModel.create(payload);
};

const getMyPartner = async (userId: string) => {
  return await PartnerModel.findOne({ userId, isDeleted: false });
};

const updatePartner = async (userId: string, payload: Partial<IPartner>) => {
  const result = await PartnerModel.findOneAndUpdate(
    { userId, isDeleted: false },
    payload,
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }
  return result;
};

const deletePartner = async (userId: string) => {
  const result = await PartnerModel.findOneAndUpdate(
    { userId, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }
  return result;
};

export const PartnerService = {
  createPartner,
  getMyPartner,
  updatePartner,
  deletePartner,
};
