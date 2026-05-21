import express from "express";
import { BucketPriorityController } from "./bucketPriority.controller";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.post(
  "/create",
  guardRole(["admin"]),
  BucketPriorityController.createPriority,
);

router.get(
  "/",
  guardRole(["admin", "user"]),
  BucketPriorityController.getAllPriorities,
);

router.patch(
  "/update/:id",
  guardRole(["admin"]),
  BucketPriorityController.updatePriority,
);

router.delete(
  "/delete/:id",
  guardRole(["admin"]),
  BucketPriorityController.deletePriority,
);

export const BucketPriorityRoutes = router;
