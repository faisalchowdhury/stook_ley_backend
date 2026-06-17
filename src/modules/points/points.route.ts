import express from "express";
import { PointsController } from "./points.controller";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.post(
  "/update",
  guardRole(["user"]),
  PointsController.updatePoints,
);

router.get(
  "/my-points",
  guardRole(["user"]),
  PointsController.getMyPoints,
);

router.post(
  "/admin-assign",
  guardRole(["admin"]),
  PointsController.adminAssignPoints,
);

export const PointsRoutes = router;
