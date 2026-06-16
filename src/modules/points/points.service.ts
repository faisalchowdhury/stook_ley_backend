import { PointsModel } from "./points.model";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const updatePoints = async (userId: string, amount: number, action: "plus" | "minus") => {
  let pointsRecord = await PointsModel.findOne({ userId });

  if (!pointsRecord) {
    pointsRecord = new PointsModel({ userId, point: 0 });
  }

  if (action === "plus") {
    pointsRecord.point += amount;
  } else if (action === "minus") {
    if (pointsRecord.point < amount) {
      throw new ApiError(httpStatus.BAD_REQUEST, "You don't have that much point");
    }
    pointsRecord.point -= amount;
  }

  return await pointsRecord.save();
};

const getMyPoints = async (userId: string) => {
  const result = await PointsModel.findOne({ userId });
  if (!result) {
    return { userId, point: 0 };
  }
  return result;
};

export const PointsService = {
  updatePoints,
  getMyPoints,
};
