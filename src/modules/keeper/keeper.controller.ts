import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { KeeperService } from "./keeper.service";
import httpStatus from "http-status";
import { IUserPayload } from "../../middlewares/roleGuard";
import ApiError from "../../errors/ApiError";

const assignKeeper = catchAsync(async (req: Request, res: Response) => {
  const { role, fullName, email, relation, contactNumber } = req.body;

  // Manual Validation
  if (!role || !fullName || !email || !relation || !contactNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, "All fields (role, fullName, email, relation, contactNumber) are required");
  }

  if (!["executor", "authorizer"].includes(role)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid role. Must be 'executor' or 'authorizer'");
  }

  const user = req.user as IUserPayload;
  const result = await KeeperService.assignKeeper(user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Keeper assigned successfully",
    data: result,
  });
});

const getMyKeepers = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const result = await KeeperService.getMyKeepers(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Keepers retrieved successfully",
    data: result,
  });
});

const getSingleKeeper = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { id } = req.params;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Keeper ID is required");
  }

  const result = await KeeperService.getSingleKeeper(id, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Keeper retrieved successfully",
    data: result,
  });
});

const updateKeeper = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { id } = req.params;
  
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Keeper ID is required");
  }

  const result = await KeeperService.updateKeeper(id, user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Keeper updated successfully",
    data: result,
  });
});

const deleteKeeper = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { id } = req.params;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Keeper ID is required");
  }

  const result = await KeeperService.deleteKeeper(id, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Keeper deleted successfully",
    data: result,
  });
});

const getAssignedToMe = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const result = await KeeperService.getAssignedToMe(user.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assignments retrieved successfully",
    data: result,
  });
});

export const KeeperController = {
  assignKeeper,
  getMyKeepers,
  getSingleKeeper,
  updateKeeper,
  deleteKeeper,
  getAssignedToMe,
};
