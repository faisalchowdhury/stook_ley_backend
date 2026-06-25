// Import the 'express' module
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFound from "./middlewares/notFound";
import router from "./routes";
import { logger, logHttpRequests } from "./logger/logger";
import { template } from "./rootTemplate";
import { PaymentController } from "./modules/payment/payment.controller";
import { PaymentRoutes } from "./modules/payment/payment.route";
import { CLIENT_URL } from "./config";

// Create an Express application
const app: Application = express();
app.use(logHttpRequests);

// Stripe webhook MUST receive the raw body for signature verification, so it
// is registered BEFORE the global express.json() body parser below.
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.stripeWebhook,
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "*",
      "https://legacy-keeper.app",
      "https://dashboard.legacy-keeper.app",
      "https://www.legacy-keeper.app/",
    ],
  }),
);

app.use(express.static("public"));

// Stripe payments JSON endpoints (fixed path the frontend calls directly).
app.use("/api/payments", PaymentRoutes);

//application router
app.use(router);

// Define a route for the root path ('/')
app.get("/", (req: Request, res: Response) => {
  logger.info("Root endpoint hit 🌐 :");
  res.status(200).send(template);
});

app.all("*", notFound);
app.use(globalErrorHandler);

// create qr code product in kolaybi

// Log errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error occurred: ${err.message}`, { stack: err.stack });
  next(err);
});

export default app;
