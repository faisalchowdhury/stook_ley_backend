import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../errors/ApiError";
import { UserModel } from "../modules/user/user.model";
import { IUserPayload } from "./roleGuard";
import httpStatus from "http-status";

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Paths that remain writable while a death report is pending or after lock. */
const SAFE_MODE_WRITE_ALLOWLIST = [
  "/api/v1/auth/respond-to-death",
];

/**
 * Blocks mutating API calls for primary users whose account is deceased
 * (Safe Mode). Read-only GET requests are still allowed so locked users
 * can view profile data and generate PDFs.
 */
export const blockDeceasedUserWrites = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (READ_METHODS.has(req.method)) return next();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY as string,
    ) as IUserPayload;

    if (decoded.role !== "user") return next();

    const requestPath = req.originalUrl.split("?")[0];
    if (SAFE_MODE_WRITE_ALLOWLIST.some((p) => requestPath.includes(p))) {
      return next();
    }

    const user = await UserModel.findById(decoded.id).select("isDeath");
    if (user?.isDeath) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "This account is in Safe Mode and cannot be modified.",
      );
    }

    return next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return next();
  }
};
