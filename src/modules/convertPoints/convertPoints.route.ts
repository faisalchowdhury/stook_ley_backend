import express from "express";
import { ConvertPointsController } from "./convertPoints.controller";

const router = express.Router();

router.post("/", ConvertPointsController.create);

export const ConvertPointsRoutes = router;
