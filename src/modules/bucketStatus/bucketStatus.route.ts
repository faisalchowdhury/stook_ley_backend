import express from "express";
import { BucketStatusController } from "./bucketStatus.controller";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.post(
  "/create",
  guardRole(["admin"]),
  BucketStatusController.createStatus,
);

router.get(
  "/",
  guardRole(["admin", "user"]),
  BucketStatusController.getAllStatuses,
);

router.patch(
  "/update/:id",
  guardRole(["admin"]),
  BucketStatusController.updateStatus,
);

router.delete(
  "/delete/:id",
  guardRole(["admin"]),
  BucketStatusController.deleteStatus,
);

export const BucketStatusRoutes = router;
