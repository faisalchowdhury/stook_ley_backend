import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserInsuranceService } from "./userInsurance.service";
import { InsuranceListModel } from "../insuranceList/insuranceList.model";
import httpStatus from "http-status";
import { IUserPayload } from "../../middlewares/roleGuard";
import ApiError from "../../errors/ApiError";

const selectInsurance = catchAsync(async (req: Request, res: Response) => {
  const { insuranceId, provider, policyNumber } = req.body;

  if (!insuranceId || !provider || !policyNumber) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "insuranceId, provider, and policyNumber are required",
    );
  }

  // Check if insurance exists and is not deleted
  const insurance = await InsuranceListModel.findOne({
    _id: insuranceId,
    isDeleted: false,
  });
  if (!insurance) {
    throw new ApiError(httpStatus.NOT_FOUND, "Insurance not found in the list");
  }

  const user = req.user as IUserPayload;
  const result = await UserInsuranceService.selectInsurance({
    userId: user.id as any,
    insuranceId,
    provider,
    policyNumber,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Insurance selected successfully",
    data: result,
  });
});

const getMyInsurances = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const result = await UserInsuranceService.getMyInsurances(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User insurances retrieved successfully",
    data: result,
  });
});

const getSingleUserInsurance = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { id } = req.params;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User Insurance ID is required");
  }

  const result = await UserInsuranceService.getSingleUserInsurance(id, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User insurance retrieved successfully",
    data: result,
  });
});

const updateMyInsurance = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { id } = req.params;
  const result = await UserInsuranceService.updateMyInsurance(
    id,
    user.id,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User insurance updated successfully",
    data: result,
  });
});

const deleteMyInsurance = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { id } = req.params;
  const result = await UserInsuranceService.deleteMyInsurance(id, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User insurance deleted successfully",
    data: result,
  });
});

export const UserInsuranceController = {
  selectInsurance,
  getMyInsurances,
  getSingleUserInsurance,
  updateMyInsurance,
  deleteMyInsurance,
};
