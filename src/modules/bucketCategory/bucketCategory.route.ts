import express from "express";
import { BucketCategoryController } from "./bucketCategory.controller";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.post(
  "/create",
  guardRole(["admin"]),
  BucketCategoryController.createCategory,
);

router.get(
  "/",
  guardRole(["admin", "user"]),
  BucketCategoryController.getAllCategories,
);

router.patch(
  "/update/:id",
  guardRole(["admin"]),
  BucketCategoryController.updateCategory,
);

router.delete(
  "/delete/:id",
  guardRole(["admin"]),
  BucketCategoryController.deleteCategory,
);

export const BucketCategoryRoutes = router;
