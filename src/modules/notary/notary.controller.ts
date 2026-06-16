import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { NotaryService } from "./notary.service";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";

const createNotary = catchAsync(async (req: Request, res: Response) => {
  const { companyName, website, location, email, phone } = req.body;

  // Manual Validation
  if (!companyName || !website || !location || !email || !phone) {
    throw new ApiError(httpStatus.BAD_REQUEST, "All fields (companyName, website, location, email, phone) are required");
  }

  const payload: any = {
    companyName,
    website,
    location,
    email,
    phone,
  };

  if (req.file) {
    payload.image = `/images/${req.file.filename}`;
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, "Image is required");
  }

  const result = await NotaryService.createNotary(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Notary created successfully",
    data: result,
  });
});

const getAllNotaries = catchAsync(async (req: Request, res: Response) => {
  const result = await NotaryService.getAllNotaries();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notaries retrieved successfully",
    data: result,
  });
});

const getSingleNotary = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NotaryService.getSingleNotary(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notary retrieved successfully",
    data: result,
  });
});

const updateNotary = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = { ...req.body };

  if (req.file) {
    payload.image = `/images/${req.file.filename}`;
  }

  const result = await NotaryService.updateNotary(id, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notary updated successfully",
    data: result,
  });
});

const deleteNotary = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NotaryService.deleteNotary(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notary deleted successfully",
    data: result,
  });
});

export const NotaryController = {
  createNotary,
  getAllNotaries,
  getSingleNotary,
  updateNotary,
  deleteNotary,
};
