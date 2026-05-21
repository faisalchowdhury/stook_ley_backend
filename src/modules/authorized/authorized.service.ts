import { Request } from "express";
import { AuthorizedModel } from "./authorized.model";
import ApiError from "../../errors/ApiError";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import { hashPassword } from "../user/user.utils";

export const createAuthorizedService = async (data: Request) => {
  const { part } = data.params;
  const { name, email, password } = data.body;
  const user = data.user as JwtPayloadWithUser;
  const userId = user.id;
  if (part != "authorized" && part != "executor") {
    throw new ApiError(400, "Invalid part value");
  }

  const isExist = await AuthorizedModel.findOne({ email, userId });

  if (isExist) {
    throw new ApiError(
      400,
      `Email is already added as ${isExist.part} of this account`,
    );
  }

  const hashedPassword = await hashPassword(password);
  const authorizedPayload = {
    userId,
    name,
    email,
    part,
    password: hashedPassword,
  };

  const createAuthorized = await AuthorizedModel.create(authorizedPayload);

  return createAuthorized;
};

export const getMyAuthorizedService = async (data: Request) => {
  const user = data.user as JwtPayloadWithUser;
  const userId = user.id;
  const { part } = data.params;
  const getAuthorized = await AuthorizedModel.findOne({ userId, part }).select(
    "-password",
  );

  const validPart = ["authorized", "executor"];

  if (!validPart.includes(part)) {
    throw new ApiError(404, `${part} is not a valid part`);
  }
  if (!getAuthorized) {
    throw new ApiError(400, `No ${part} user found`);
  }
  return getAuthorized;
};

export const getAuthorizedPersonService = async (data: Request) => {
  const user = data.user as JwtPayloadWithUser;
  const userId = user.id;

  const { authorizedId } = data.params;
  console.log(authorizedId);
  const findAuhtorized = await AuthorizedModel.findOne({
    _id: authorizedId,
    userId,
  }).select("-password");
  if (!authorizedId) {
    throw new ApiError(404, "Authorized person not found");
  }
  return findAuhtorized;
};

export const editAuthorizedPersonService = async (data: Request) => {
  const user = data.user as JwtPayloadWithUser;
  const userId = user.id;
  const { authorizedId } = data.params;
  const { name, email, password } = data.body;
  const hashedPassword = await hashPassword(password);
  const authorizedPayload = {
    name,
    email,
    hashedPassword,
  };

  const isExist = await AuthorizedModel.findOne({ _id: authorizedId, userId });

  if (!isExist) {
    throw new ApiError(400, "Authorized person not found");
  }

  const editAuthorized = await AuthorizedModel.findOneAndUpdate(
    { _id: authorizedId },
    authorizedPayload,
    { new: true },
  );

  return editAuthorized;
};
