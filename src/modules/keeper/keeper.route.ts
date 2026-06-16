import express from "express";
import { KeeperController } from "./keeper.controller";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.post("/assign", guardRole(["user"]), KeeperController.assignKeeper);

router.get("/my-keepers", guardRole(["user"]), KeeperController.getMyKeepers);

router.get(
  "/assigned-to-me",
  guardRole(["user", "executor", "authorizer"]),
  KeeperController.getAssignedToMe,
);

router.get("/:id", guardRole(["user"]), KeeperController.getSingleKeeper);

router.patch("/update/:id", guardRole(["user"]), KeeperController.updateKeeper);

router.delete(
  "/delete/:id",
  guardRole(["user"]),
  KeeperController.deleteKeeper,
);

export const KeeperRoutes = router;
