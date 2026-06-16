import express from "express";
import { PartnerController } from "./partner.controller";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.post(
  "/create",
  guardRole(["user"]),
  PartnerController.createPartner,
);

router.get(
  "/my-partner",
  guardRole(["user"]),
  PartnerController.getMyPartner,
);

router.patch(
  "/update",
  guardRole(["user"]),
  PartnerController.updatePartner,
);

router.delete(
  "/delete",
  guardRole(["user"]),
  PartnerController.deletePartner,
);

export const PartnerRoutes = router;
