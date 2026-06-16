import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PartnerService } from "./partner.service";
import httpStatus from "http-status";
import { IUserPayload } from "../../middlewares/roleGuard";
import ApiError from "../../errors/ApiError";

const createPartner = catchAsync(async (req: Request, res: Response) => {
  const { name, phone, email } = req.body;
  if (!name || !phone || !email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "name, phone and email are required");
  }

  const user = req.user as IUserPayload;
  const result = await PartnerService.createPartner({
    userId: user.id as any,
    name,
    phone,
    email,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Partner created successfully",
    data: result,
  });
});

const getMyPartner = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const result = await PartnerService.getMyPartner(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Partner retrieved successfully",
    data: result,
  });
});

const updatePartner = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const result = await PartnerService.updatePartner(user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Partner updated successfully",
    data: result,
  });
});

const deletePartner = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const result = await PartnerService.deletePartner(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Partner deleted successfully",
    data: result,
  });
});

export const PartnerController = {
  createPartner,
  getMyPartner,
  updatePartner,
  deletePartner,
};
