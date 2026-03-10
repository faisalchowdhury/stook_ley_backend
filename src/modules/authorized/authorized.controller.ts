import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { createAuthorizedService } from "./authorized.service";

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
