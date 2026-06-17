import express from "express";
import { RewardConfigController } from "./rewardConfig.controller";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.get("/", guardRole(["admin"]), RewardConfigController.getAll);
router.patch("/update/:id", guardRole(["admin"]), RewardConfigController.update);

export const RewardConfigRoutes = router;
