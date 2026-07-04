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
  guardRole(["user" ,"executor" , "authorizer" , "admin"]),
  PointsController.getMyPoints,
);

router.post(
  "/admin-assign",
  guardRole(["admin"]),
  PointsController.adminAssignPoints,
);

// alias: admin assign points to any user
router.post(
  "/admin/assign",
  guardRole(["admin"]),
  PointsController.adminAssignPoints,
);

router.get(
  "/admin/users-with-points",
  guardRole(["admin"]),
  PointsController.getUsersWithPoints,
);

export const PointsRoutes = router;
