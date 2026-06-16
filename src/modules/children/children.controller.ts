import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ChildrenService } from "./children.service";
import httpStatus from "http-status";
import { IUserPayload } from "../../middlewares/roleGuard";
import ApiError from "../../errors/ApiError";

const createChild = catchAsync(async (req: Request, res: Response) => {
  const { name, gender } = req.body;
  if (!name || !gender) {
    throw new ApiError(httpStatus.BAD_REQUEST, "name and gender are required");
  }

  const user = req.user as IUserPayload;
  const result = await ChildrenService.createChild({
    userId: user.id as any,
    name,
    gender,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Child added successfully",
    data: result,
  });
});

const createMultipleChildren = catchAsync(async (req: Request, res: Response) => {
  const children = req.body;
  if (!children || !Array.isArray(children) || children.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "An array of children is required");
  }

  // Basic validation for each child
  children.forEach((child: any) => {
    if (!child.name || !child.gender) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Each child must have a name and gender");
    }
  });

  const user = req.user as IUserPayload;
  const result = await ChildrenService.createMultipleChildren(user.id, children);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Children added successfully",
    data: result,
  });
});

const getMyChildren = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const result = await ChildrenService.getMyChildren(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Children retrieved successfully",
    data: result,
  });
});

const getSingleChild = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { id } = req.params;
  const result = await ChildrenService.getSingleChild(id, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Child retrieved successfully",
    data: result,
  });
});

const updateChild = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { id } = req.params;
  const result = await ChildrenService.updateChild(id, user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Child updated successfully",
    data: result,
  });
});

const deleteChild = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { id } = req.params;
  const result = await ChildrenService.deleteChild(id, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Child deleted successfully",
    data: result,
  });
});

export const ChildrenController = {
  createChild,
  createMultipleChildren,
  getMyChildren,
  getSingleChild,
  updateChild,
  deleteChild,
};
