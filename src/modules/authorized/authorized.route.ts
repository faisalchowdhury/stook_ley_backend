import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { createAuthorized } from "./authorized.controller";

const route = express.Router();

route.post("/create-authorized/:part", guardRole(["user"]), createAuthorized);
