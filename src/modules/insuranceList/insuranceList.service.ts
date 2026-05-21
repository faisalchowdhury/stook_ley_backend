import { InsuranceListModel } from "./insuranceList.model";
import { IInsuranceList } from "./insuranceList.interface";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createInsurance = async (payload: Partial<IInsuranceList>) => {
  return await InsuranceListModel.create(payload);
};

const getAllInsurances = async () => {
  return await InsuranceListModel.find({ isDeleted: false }).sort({ createdAt: -1 });
};

const getSingleInsurance = async (id: string) => {
  const result = await InsuranceListModel.findOne({ _id: id, isDeleted: false });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Insurance not found");
  }
  return result;
};

const updateInsurance = async (id: string, payload: Partial<IInsuranceList>) => {
  const result = await InsuranceListModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Insurance not found");
  }
  return result;
};

const deleteInsurance = async (id: string) => {
  const result = await InsuranceListModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Insurance not found");
  }
  return result;
};

export const InsuranceListService = {
  createInsurance,
  getAllInsurances,
  getSingleInsurance,
  updateInsurance,
  deleteInsurance,
};
