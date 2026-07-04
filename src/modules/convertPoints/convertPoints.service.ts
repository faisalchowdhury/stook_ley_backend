import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import paginationBuilder from "../../utils/paginationBuilder";
import { ConvertPointsModel } from "./convertPoints.model";
import { PointsService } from "../points/points.service";

type GetAllParams = {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
};

type CreateRequestParams = {
  userId: string;
  email: string;
  solana_wallet_address: string;
  amount: number;
};

const getAllRequests = async ({
  status,
  page = 1,
  limit = 10,
  search,
}: GetAllParams) => {
  const query: Record<string, unknown> = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { solana_wallet_address: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    ConvertPointsModel.find(query)
      .populate("userId", "name email phone role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ConvertPointsModel.countDocuments(query),
  ]);

  return {
    requests,
    pagination: paginationBuilder({ totalData: total, currentPage: page, limit }),
  };
};

const getRequestById = async (id: string) => {
  const request = await ConvertPointsModel.findById(id).populate(
    "userId",
    "name email phone role",
  );

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, "Convert points request not found");
  }

  return request;
};

/**
 * Deducts points immediately when a conversion request is submitted.
 * Points are refunded only if admin rejects the request.
 */
const createRequest = async ({
  userId,
  email,
  solana_wallet_address,
  amount,
}: CreateRequestParams) => {
  const existingPending = await ConvertPointsModel.findOne({
    userId,
    status: "pending",
  });

  if (existingPending) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You already have a pending conversion request",
    );
  }

  const pointsRecord = await PointsService.getMyPoints(userId);
  const availablePoints = pointsRecord.point ?? 0;

  if (availablePoints < amount) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Not enough points to convert");
  }

  await PointsService.updatePoints(userId, amount, "minus");

  try {
    return await ConvertPointsModel.create({
      userId,
      email,
      solana_wallet_address,
      amount,
      status: "pending",
      isPointsDeducted: true,
    });
  } catch (error) {
    await PointsService.updatePoints(userId, amount, "plus").catch((refundErr) =>
      console.error("Failed to refund points after request creation error:", refundErr),
    );
    throw error;
  }
};

const updateRequestStatus = async (
  id: string,
  status: "approved" | "rejected",
) => {
  const request = await ConvertPointsModel.findById(id);

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, "Convert points request not found");
  }

  if (request.status !== "pending") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Request is already ${request.status}`,
    );
  }

  if (status === "rejected") {
    if (request.isPointsDeducted) {
      await PointsService.updatePoints(
        String(request.userId),
        request.amount,
        "plus",
      );
      request.isPointsDeducted = false;
    }
  } else if (status === "approved" && !request.isPointsDeducted) {
    // Legacy requests created before deduct-on-submit — deduct on approve
    await PointsService.updatePoints(
      String(request.userId),
      request.amount,
      "minus",
    );
    request.isPointsDeducted = true;
  }

  request.status = status;
  await request.save();

  return ConvertPointsModel.findById(id).populate(
    "userId",
    "name email phone role",
  );
};

export const ConvertPointsService = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
};
