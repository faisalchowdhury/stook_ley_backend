import { NotaryModel } from "./notary.model";
import { INotary } from "./notary.interface";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createNotary = async (payload: Partial<INotary>) => {
  return await NotaryModel.create(payload);
};

const getAllNotaries = async () => {
  return await NotaryModel.find({ isDeleted: false }).sort({ createdAt: -1 });
};

const getSingleNotary = async (id: string) => {
  const result = await NotaryModel.findOne({ _id: id, isDeleted: false });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Notary not found");
  }
  return result;
};

const updateNotary = async (id: string, payload: Partial<INotary>) => {
  const result = await NotaryModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Notary not found");
  }
  return result;
};

const deleteNotary = async (id: string) => {
  const result = await NotaryModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Notary not found");
  }
  return result;
};

export const NotaryService = {
  createNotary,
  getAllNotaries,
  getSingleNotary,
  updateNotary,
  deleteNotary,
};
