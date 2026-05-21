import express from "express";
import { UserInsuranceController } from "./userInsurance.controller";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.post(
  "/select",
  guardRole(["user"]),
  UserInsuranceController.selectInsurance,
);

router.get(
  "/my-insurances",
  guardRole(["user"]),
  UserInsuranceController.getMyInsurances,
);

router.get(
  "/:id",
  guardRole(["user"]),
  UserInsuranceController.getSingleUserInsurance,
);

router.patch(
  "/update/:id",
  guardRole(["user"]),
  UserInsuranceController.updateMyInsurance,
);

router.delete(
  "/delete/:id",
  guardRole(["user"]),
  UserInsuranceController.deleteMyInsurance,
);

export const UserInsuranceRoutes = router;
