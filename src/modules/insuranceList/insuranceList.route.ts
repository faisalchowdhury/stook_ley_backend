import express from "express";
import { InsuranceListController } from "./insuranceList.controller";
import { guardRole } from "../../middlewares/roleGuard";
import upload from "../../multer/multer";

const router = express.Router();

router.post(
  "/create",
  guardRole(["admin"]),
  upload.single("image"),
  InsuranceListController.createInsurance,
);

router.get(
  "/",
  guardRole(["admin", "user"]),
  InsuranceListController.getAllInsurances,
);

router.get(
  "/:id",
  guardRole(["admin", "user"]),
  InsuranceListController.getSingleInsurance,
);

router.patch(
  "/update/:id",
  guardRole(["admin"]),
  upload.single("image"),
  InsuranceListController.updateInsurance,
);

router.delete(
  "/delete/:id",
  guardRole(["admin"]),
  InsuranceListController.deleteInsurance,
);

export const InsuranceListRoutes = router;
