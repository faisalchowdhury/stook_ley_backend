import express from "express";
import { NotaryController } from "./notary.controller";
import { guardRole } from "../../middlewares/roleGuard";
import upload from "../../multer/multer";

const router = express.Router();

router.post(
  "/create",
  guardRole(["admin"]),
  upload.single("image"),
  NotaryController.createNotary,
);

router.get(
  "/",
  guardRole(["admin", "user"]),
  NotaryController.getAllNotaries,
);

router.get(
  "/:id",
  guardRole(["admin", "user"]),
  NotaryController.getSingleNotary,
);

router.patch(
  "/update/:id",
  guardRole(["admin"]),
  upload.single("image"),
  NotaryController.updateNotary,
);

router.delete(
  "/delete/:id",
  guardRole(["admin"]),
  NotaryController.deleteNotary,
);

export const NotaryRoutes = router;
