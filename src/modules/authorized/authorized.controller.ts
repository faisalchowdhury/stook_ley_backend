import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import {
  createAuthorizedService,
  editAuthorizedPersonService,
  getAuthorizedPersonService,
  getMyAuthorizedService,
} from "./authorized.service";

export const createAuthorized = catchAsync(
  async (req: Request, res: Response) => {
    const { part } = req.params;
    const createAuthorized = await createAuthorizedService(req);

    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: `Well done ! you have created ${part} successfully`,
      data: createAuthorized,
    });
  },
);

export const getMyAuthorized = catchAsync(
  async (req: Request, res: Response) => {
    const getMyAuthorized = await getMyAuthorizedService(req);

    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Fetched authorized users",
      data: getMyAuthorized,
    });
  },
);

export const getAuthorizedPerson = catchAsync(
  async (req: Request, res: Response) => {
    const getAuthorizedPerson = await getAuthorizedPersonService(req);

    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: `Fetched authorized person`,
      data: getAuthorizedPerson,
    });
  },
);

export const editAuthorizedPerson = catchAsync(
  async (req: Request, res: Response) => {
    const editAuthorizedPerson = await editAuthorizedPersonService(req);

    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Edited authorized person",
      data: editAuthorizedPerson,
    });
  },
);
