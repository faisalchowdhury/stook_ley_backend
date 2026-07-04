import paginationBuilder from "../../utils/paginationBuilder";
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

const assignPointsToUser = async (userId: string, points: number) => {
  let pointsRecord = await PointsModel.findOne({ userId });
  const previousPoints = pointsRecord?.point ?? 0;

  if (!pointsRecord) {
    pointsRecord = new PointsModel({ userId, point: points });
  } else {
    pointsRecord.point += points;
  }

  const saved = await pointsRecord.save();

  return {
    userId: saved.userId,
    previousPoints,
    assignedPoints: points,
    totalPoints: saved.point,
    record: saved,
  };
};

const getMyPoints = async (userId: string) => {
  const result = await PointsModel.findOne({ userId });

  if (!result) {
    return {
      userId,
      point: 0,
      availablePoints: 0,
    };
  }

  return {
    _id: result._id,
    userId: result.userId,
    point: result.point,
    availablePoints: result.point,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
};

type GetUsersWithPointsParams = {
  skip: number;
  limit: number;
  name?: string;
  email?: string;
  role?: string;
};

const getUsersWithPoints = async ({
  skip,
  limit,
  name,
  email,
  role,
}: GetUsersWithPointsParams) => {
  const userMatch: Record<string, unknown> = {
    "user.isDeleted": { $ne: true },
    "user.role": { $nin: ["admin"] },
  };

  if (name) userMatch["user.name"] = { $regex: name, $options: "i" };
  if (email) userMatch["user.email"] = { $regex: email, $options: "i" };
  if (role) userMatch["user.role"] = { $regex: role, $options: "i" };

  const pipeline: Record<string, unknown>[] = [
    { $match: { point: { $gt: 0 } } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $match: userMatch },
    { $sort: { point: -1, createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: "$user._id",
              name: "$user.name",
              email: "$user.email",
              phone: "$user.phone",
              role: "$user.role",
              address: "$user.address",
              profilePicture: "$user.profilePicture",
              isDeleted: "$user.isDeleted",
              isVerified: "$user.isVerified",
              createdAt: "$user.createdAt",
              availablePoints: "$point",
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await PointsModel.aggregate(pipeline);
  const users = result?.data ?? [];
  const total = result?.totalCount?.[0]?.count ?? 0;
  const currentPage = Math.floor(skip / limit) + 1;

  return {
    users,
    pagination: paginationBuilder({ totalData: total, currentPage, limit }),
  };
};

export const PointsService = {
  updatePoints,
  assignPointsToUser,
  getMyPoints,
  getUsersWithPoints,
};
