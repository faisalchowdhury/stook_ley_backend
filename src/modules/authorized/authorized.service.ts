import { Request } from "express";
import { AuthorizedModel } from "./authorized.model";

export const createAuthorizedService = async (data: Request) => {
  const { part } = data.params;
  const { name, email } = data.body;
  const authorizedPayload = {
    name,
    email,
    part,
  };

  const createAuthorized = await AuthorizedModel.create(authorizedPayload);

  return createAuthorized;
};
