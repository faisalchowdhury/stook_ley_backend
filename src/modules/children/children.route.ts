import express from "express";
import { ChildrenController } from "./children.controller";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.post(
  "/add",
  guardRole(["user"]),
  ChildrenController.createChild,
);

router.post(
  "/add-multiple",
  guardRole(["user"]),
  ChildrenController.createMultipleChildren,
);

router.get(
  "/my-children",
  guardRole(["user"]),
  ChildrenController.getMyChildren,
);

router.get(
  "/:id",
  guardRole(["user"]),
  ChildrenController.getSingleChild,
);

router.patch(
  "/update/:id",
  guardRole(["user"]),
  ChildrenController.updateChild,
);

router.delete(
  "/delete/:id",
  guardRole(["user"]),
  ChildrenController.deleteChild,
);

export const ChildrenRoutes = router;
