import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  createAuthorized,
  editAuthorizedPerson,
  getAuthorizedPerson,
  getMyAuthorized,
} from "./authorized.controller";

const route = express.Router();

route.post("/create-authorized/:part", guardRole(["user"]), createAuthorized);
route.get("/my-authorized/:part", guardRole(["user"]), getMyAuthorized);
route.get(
  "/authorized-person/:authorizedId",
  guardRole(["user"]),
  getAuthorizedPerson,
);
route.patch(
  "/edit-authorized/:authorizedId",
  guardRole(["user"]),
  editAuthorizedPerson,
);

export const AuthorizedRoutes = route;
