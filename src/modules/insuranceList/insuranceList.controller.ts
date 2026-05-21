import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { InsuranceListService } from "./insuranceList.service";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";

const createInsurance = catchAsync(async (req: Request, res: Response) => {
  const { name, description, company, websiteLink, location } = req.body;

  if (!name || !description || !company || !websiteLink || !location) {
    throw new ApiError(httpStatus.BAD_REQUEST, "All fields are required");
  }

  const payload: any = {
    name,
    description,
    company,
    websiteLink,
    location,
  };

  if (req.file) {
    payload.image = `/images/${req.file.filename}`;
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, "Image is required");
  }

  const result = await InsuranceListService.createInsurance(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Insurance created successfully",
    data: result,
  });
});

const getAllInsurances = catchAsync(async (req: Request, res: Response) => {
  const result = await InsuranceListService.getAllInsurances();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Insurances retrieved successfully",
    data: result,
  });
});

const getSingleInsurance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await InsuranceListService.getSingleInsurance(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Insurance retrieved successfully",
    data: result,
  });
});

const updateInsurance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = { ...req.body };

  if (req.file) {
    payload.image = `/images/${req.file.filename}`;
  }

  const result = await InsuranceListService.updateInsurance(id, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Insurance updated successfully",
    data: result,
  });
});

const deleteInsurance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await InsuranceListService.deleteInsurance(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Insurance deleted successfully",
    data: result,
  });
});

export const InsuranceListController = {
  createInsurance,
  getAllInsurances,
  getSingleInsurance,
  updateInsurance,
  deleteInsurance,
};
