import express from "express";
import { BucketListController } from "./bucketList.controller";
import { guardRole } from "../../middlewares/roleGuard";
import upload from "../../multer/multer";

const router = express.Router();

router.post(
  "/create",
  guardRole(["user"]),
  upload.single("photo"),
  BucketListController.createBucketItem,
);

router.get(
  "/",
  guardRole(["user"]),
  BucketListController.getMyBucketList,
);

router.get(
  "/:id",
  guardRole(["user"]),
  BucketListController.getSingleBucketItem,
);

router.patch(
  "/update/:id",
  guardRole(["user"]),
  upload.single("photo"),
  BucketListController.updateBucketItem,
);

router.delete(
  "/delete/:id",
  guardRole(["user"]),
  BucketListController.deleteBucketItem,
);

export const BucketListRoutes = router;
