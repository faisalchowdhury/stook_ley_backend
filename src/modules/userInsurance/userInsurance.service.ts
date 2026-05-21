import { UserInsuranceModel } from "./userInsurance.model";
import { IUserInsurance } from "./userInsurance.interface";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const selectInsurance = async (payload: Partial<IUserInsurance>) => {
  return await UserInsuranceModel.create(payload);
};

const getMyInsurances = async (userId: string) => {
  return await UserInsuranceModel.find({ userId, isDeleted: false }).populate("insuranceId");
};

const getSingleUserInsurance = async (id: string, userId: string) => {
  const result = await UserInsuranceModel.findOne({
    _id: id,
    userId,
    isDeleted: false,
  }).populate("insuranceId");
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User insurance record not found");
  }
  return result;
};

const updateMyInsurance = async (id: string, userId: string, payload: Partial<IUserInsurance>) => {
  const result = await UserInsuranceModel.findOneAndUpdate(
    { _id: id, userId, isDeleted: false },
    payload,
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User insurance record not found");
  }
  return result;
};

const deleteMyInsurance = async (id: string, userId: string) => {
  const result = await UserInsuranceModel.findOneAndUpdate(
    { _id: id, userId, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User insurance record not found");
  }
  return result;
};

export const UserInsuranceService = {
  selectInsurance,
  getMyInsurances,
  getSingleUserInsurance,
  updateMyInsurance,
  deleteMyInsurance,
};
