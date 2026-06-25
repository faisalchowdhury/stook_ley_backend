import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join((process.cwd(), ".env")) });

// Twilio Config

export const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
export const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
export const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// export const PORT = 8085; //------> production;
export const PORT = 6000; //------> development;
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
export const Nodemailer_GMAIL = process.env.Nodemailer_GMAIL;
export const Nodemailer_GMAIL_PASSWORD = process.env.Nodemailer_GMAIL_PASSWORD;
export const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER;
export const max_file_size = 52428800; //-> 50MB;

export const STRIPE_WEBHOOK_ENDPOINT_SECRET = process.env.endpoint_secret;
export const STRIPE_BASE_URL = "https://grassrootz-asifur-rahman.sarv.live/";
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
export const STRIPE_PUBLISH_KEY = process.env.STRIPE_PUBLISH_KEY;

// Stripe Checkout (hosted) payments
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
export const PRODUCT_PRICE_ID = process.env.PRODUCT_PRICE_ID || "";
export const NODE_ENV = process.env.NODE_ENV;
export const REDIS_HOST = "localhost";
export const REDIS_PORT = 8002;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const REDIS_DB = 0;
export const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID || "";
export const ONE_SIGNAL_REST_API_KEY =
  process.env.ONE_SIGNAL_REST_API_KEY || "";

export const FIREBASE_SERVICE_ACCOUNT_PATH =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.resolve(
    process.cwd(),
    "src/config/legacy-keeper-f619b-firebase-adminsdk.json",
  );
