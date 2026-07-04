import express from "express";
import { routesConfig } from "./routesConfig";
import { blockDeceasedUserWrites } from "../middlewares/safeModeGuard";

const router = express.Router();
const apiPath = "/api/v1";

router.use(apiPath, blockDeceasedUserWrites);

routesConfig.forEach(({ path, handler }) =>
  router.use(`${apiPath}/${path}`, handler)
);

export default router;
