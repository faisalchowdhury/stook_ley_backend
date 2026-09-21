import express from "express";
import { ConvertPointsController } from "./convertPoints.controller";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.post("/", guardRole(["user"]), ConvertPointsController.create);

router.get(
  "/admin/requests",
  guardRole(["admin"]),
  ConvertPointsController.getAllRequests,
);

router.get(
  "/admin/requests/:id",
  guardRole(["admin"]),
  ConvertPointsController.getRequestById,
);

router.patch(
  "/admin/requests/:id/status",
  guardRole(["admin"]),
  ConvertPointsController.updateStatus,
);

export const ConvertPointsRoutes = router;
