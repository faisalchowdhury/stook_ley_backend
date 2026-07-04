import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join((process.cwd(), ".env")) });

// Twilio Config

export const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
export const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
export const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// export const PORT = 8080; //------> production;
export const PORT = Number(process.env.PORT || 8080);
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
export const CREDENTIAL_ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY;
// Strato SMTP (legacy Gmail env vars kept as fallback)
export const SMTP_HOST = process.env.SMTP_HOST || "smtp.strato.de";
export const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
export const SMTP_USER =
  process.env.SMTP_USER || process.env.Nodemailer_GMAIL || "";
export const SMTP_PASSWORD =
  process.env.SMTP_PASSWORD || process.env.Nodemailer_GMAIL_PASSWORD || "";
export const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
export const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER;
export const max_file_size = 52428800; //-> 50MB;

export const STRIPE_WEBHOOK_ENDPOINT_SECRET = process.env.endpoint_secret;
export const STRIPE_BASE_URL = "https://grassrootz-asifur-rahman.sarv.live/";
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
export const STRIPE_PUBLISH_KEY = process.env.STRIPE_PUBLISH_KEY;

// Stripe Checkout (hosted) payments
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
export const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || `https://api.legacy-keeper.app`;
export const EMAIL_LOGO_URL =
  process.env.EMAIL_LOGO_URL ||
  `${PUBLIC_BASE_URL.replace(/\/$/, "")}/images/logo.png`;
export const BRAND_URL = process.env.dashboard_url || "https://legacy-keeper.app";
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
