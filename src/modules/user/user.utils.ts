import crypto from "crypto";
import { OTPModel, UserModel } from "./user.model";
import {
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USER,
  BRAND_URL,
} from "../../config";

import nodemailer from "nodemailer";
import { IUser } from "./user.interface";

import argon2 from "argon2";
import ApiError from "../../errors/ApiError";
import { buildEmailTemplate, emailHelpers, getEmailLogoAttachments } from "../../utils/emailTemplate";

const createMailTransporter = () => {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    throw new ApiError(500, "Email service is not configured.");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
};

const sendEmail = async (options: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> => {
  const transporter = createMailTransporter();

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: getEmailLogoAttachments(),
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    if (error && (error.code === "EENVELOPE" || error.responseCode === 550)) {
      console.warn(`Email delivery skipped (recipient rejected or does not exist): ${options.to}`);
      return; // Swallow recipient rejection errors so the API flows proceed normally
    }
    throw new ApiError(500, "Unexpected error occurred during email sending.");
  }
};

export const sendOTPEmailRegister = async (
  name: string,
  email: string,
  otp: string,
): Promise<void> => {
  const html = buildEmailTemplate({
    preheader: `Your ${process.env.AppName} registration code is ${otp}`,
    greeting: `Hello ${name}!`,
    body: `
      ${emailHelpers.paragraph("Thank you for registering. Use the verification code below to complete your account setup.")}
      ${emailHelpers.otpBlock(otp, "Registration code")}
      ${emailHelpers.paragraph("If you did not create an account, no further action is required.")}
    `,
  });

  await sendEmail({
    to: email,
    subject: "Registration OTP",
    html,
  });
};

export const sendOTPEmailVerification = async (
  name: string,
  email: string,
  otp: string,
): Promise<void> => {
  const html = buildEmailTemplate({
    preheader: `Verify your ${process.env.AppName} account with code ${otp}`,
    greeting: `Hello ${name}!`,
    body: `
      ${emailHelpers.paragraph("Your account is not yet verified. Please use the code below to complete verification.")}
      ${emailHelpers.otpBlock(otp, "Verification code")}
      ${emailHelpers.paragraph("If you did not request this, please ignore this email.")}
    `,
  });

  await sendEmail({
    to: email,
    subject: "Verify Your Account - OTP",
    html,
  });
};

export const sendLoginOTPEmail = async (
  name: string,
  email: string,
  otp: string,
): Promise<void> => {
  const html = buildEmailTemplate({
    preheader: `Your login code is ${otp}`,
    greeting: `Hello ${name}!`,
    body: `
      ${emailHelpers.paragraph("Use the code below to continue signing in to your account.")} 
      ${emailHelpers.otpBlock(otp, "Login code")}
      ${emailHelpers.paragraph("If you did not try to sign in, you can safely ignore this email.")} 
    `,
  });

  await sendEmail({
    to: email,
    subject: "Login OTP",
    html,
  });
};

export const sendAssignedNotify = async (
  name: string,
  email: string,
  role: string,
  assignerName: string,
): Promise<void> => {
  const html = buildEmailTemplate({
    preheader: `You have been assigned as ${role} on ${process.env.AppName}`,
    greeting: `Hello ${name}!`,
    body: `
      ${emailHelpers.paragraph(
        `You have been assigned as ${emailHelpers.highlight(role)} by ${emailHelpers.highlight(assignerName)}.`,
      )}
      ${emailHelpers.paragraph("Sign in to your account to view your responsibilities and get started.")}
      ${emailHelpers.ctaButton("Open Legacy Keeper", BRAND_URL)}
      ${emailHelpers.paragraph("If you did not expect this assignment, please contact your administrator.")}
    `,
    footerNote: "This is an automated notification from Legacy Keeper.",
  });

  await sendEmail({
    to: email,
    subject: "You've Been Assigned a Role",
    html,
  });
};

export const sendExecutorAccessEmail = async (
  executorName: string,
  email: string,
  deceasedName: string,
  deceasedPhone: string,
  devicePassword: string,
  appPassword: string,
): Promise<void> => {
  const html = buildEmailTemplate({
    preheader: `Executor access is ready for ${deceasedName}`,
    greeting: `Hello ${executorName}!`,
    body: `
      ${emailHelpers.paragraph(
        `The account of ${emailHelpers.highlight(deceasedName)} has been confirmed deceased and is now in Safe Mode.`,
      )}
      ${emailHelpers.paragraph(
        `Log in to the device of ${emailHelpers.highlight(deceasedName)} using the details below:`,
      )}
      ${emailHelpers.infoCard([
        { label: "Phone", value: deceasedPhone },
        { label: "Device password", value: devicePassword },
        { label: "App password", value: appPassword },
      ])}
      ${emailHelpers.paragraph(
        "Open the Legacy Keeper app and go to the Executor section to manage this account.",
      )}
      ${emailHelpers.ctaButton("Open Legacy Keeper", BRAND_URL)}
    `,
    footerNote: "This is a secure executor notification from Legacy Keeper.",
  });

  await sendEmail({
    to: email,
    subject: `Executor access ready — ${deceasedName}`,
    html,
  });
};

export const getStoredOTP = async (email: string): Promise<string | null> => {
  const otpRecord = await OTPModel.findOne({ email });
  return otpRecord ? otpRecord.otp : null;
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
): Promise<void> => {
  const html = buildEmailTemplate({
    preheader: `Your verification code is ${otp}`,
    greeting: "Hello!",
    body: `
      ${emailHelpers.paragraph("You are receiving this email because we received a registration request for your account.")}
      ${emailHelpers.otpBlock(otp)}
      ${emailHelpers.paragraph("If you did not request this, no further action is required.")}
    `,
  });

  await sendEmail({
    to: email,
    subject: "Registration OTP",
    html,
  });
};

export const resendOTPEmail = async (
  email: string,
  otp: string,
): Promise<void> => {
  try {
    const html = buildEmailTemplate({
      preheader: `Your new verification code is ${otp}`,
      greeting: "Hello!",
      body: `
        ${emailHelpers.paragraph("We received a request for a new verification code. Use the code below to continue.")}
        ${emailHelpers.otpBlock(otp, "New verification code")}
        ${emailHelpers.paragraph("If you did not request this, please ignore this email.")}
      `,
    });

    await sendEmail({
      to: email,
      subject: "Resend OTP",
      html,
    });
  } catch (error) {
    console.error(`Error sending OTP email to ${email}:`, error);
    throw new ApiError(500, "Unexpected error occurred during email sending.");
  }
};

export const sendResetOTPEmail = async (
  email: string,
  otp: string,
  name: string,
): Promise<void> => {
  try {
    const html = buildEmailTemplate({
      preheader: `Reset your password with code ${otp}`,
      greeting: `Hello ${name}!`,
      body: `
        ${emailHelpers.paragraph("We received a password reset request for your account. Use the code below to proceed.")}
        ${emailHelpers.otpBlock(otp, "Password reset code")}
        ${emailHelpers.paragraph("If you did not request a password reset, you can safely ignore this email.")}
      `,
    });

    await sendEmail({
      to: email,
      subject: "Reset Password OTP",
      html,
    });
  } catch (error) {
    console.error(`Error sending OTP email to ${email}:`, error);
    throw new ApiError(500, "Unexpected error occurred during email sending.");
  }
};

export const sendManagerRequest = async (
  emails: string | string[],
  name: string,
  email: string,
): Promise<void> => {
  try {
    const html = buildEmailTemplate({
      preheader: `New manager request from ${name}`,
      greeting: "Hello Admin!",
      body: `
        ${emailHelpers.paragraph(
          `A new manager request has been submitted by ${emailHelpers.highlight(name)} (${emailHelpers.highlight(email)}).`,
        )}
        ${emailHelpers.paragraph("Please review the request and take the appropriate action in the admin dashboard.")}
        ${emailHelpers.ctaButton("Review Request", BRAND_URL)}
      `,
      footerNote:
        "This is an automated notification. Please do not reply directly to this email.",
    });

    await sendEmail({
      to: emails,
      subject: "New Manager Request Notification",
      html,
    });
  } catch (error) {
    console.error(`Error sending manager request email to ${emails}:`, error);
    throw new ApiError(
      500,
      "Unexpected error occurred during sending manager request email.",
    );
  }
};

type ConvertPointsAdminEmailParams = {
  userName: string;
  userEmail: string;
  amount: number;
  walletAddress: string;
  requestId: string;
};

export const sendConvertPointsAdminNotification = async (
  adminEmails: string[],
  {
    userName,
    userEmail,
    amount,
    walletAddress,
    requestId,
  }: ConvertPointsAdminEmailParams,
): Promise<void> => {
  if (adminEmails.length === 0) {
    console.warn("No admin emails found for convert points notification.");
    return;
  }

  const html = buildEmailTemplate({
    preheader: `${userName} requested to convert ${amount} coins`,
    greeting: "Hello Admin!",
    body: `
      ${emailHelpers.paragraph(
        `${emailHelpers.highlight(userName)} has submitted a new coin conversion request. Please review the details below.`,
      )}
      ${emailHelpers.infoCard([
        { label: "User email", value: userEmail },
        { label: "Coins to convert", value: String(amount) },
        { label: "Solana wallet", value: walletAddress },
        { label: "Request ID", value: requestId },
        { label: "Status", value: "Pending" },
      ])}
      ${emailHelpers.paragraph("Please process this request in the admin dashboard.")}
      ${emailHelpers.ctaButton("Open Admin Dashboard", BRAND_URL)}
    `,
    footerNote:
      "This is an automated notification. Please do not reply directly to this email.",
  });

  await sendEmail({
    to: adminEmails,
    subject: `New Coin Conversion Request — ${amount} coins`,
    html,
  });
};

type PointsAssignedEmailParams = {
  name: string;
  email: string;
  assignedPoints: number;
  previousPoints: number;
  totalPoints: number;
  reason?: string | null;
};

export const sendPointsAssignedEmail = async ({
  name,
  email,
  assignedPoints,
  previousPoints,
  totalPoints,
  reason,
}: PointsAssignedEmailParams): Promise<void> => {
  const reasonSection = reason?.trim()
    ? emailHelpers.reasonBox(reason.trim())
    : emailHelpers.paragraph(
        "No additional reason was provided for this assignment.",
      );

  const html = buildEmailTemplate({
    preheader: `Legacy Keeper awarded you ${assignedPoints} points`,
    greeting: `Hello ${name}!`,
    body: `
      ${emailHelpers.paragraph(
        `Great news! ${emailHelpers.highlight("Legacy Keeper")} has assigned new points to your account.`,
      )}
      ${emailHelpers.pointsBadge(assignedPoints)}
      ${reasonSection}
      ${emailHelpers.infoCard([
        { label: "Previous balance", value: String(previousPoints) },
        { label: "Points added", value: `+${assignedPoints}` },
        { label: "New total balance", value: String(totalPoints) },
      ])}
      ${emailHelpers.paragraph("You can view your updated balance anytime in the Legacy Keeper app.")}
      ${emailHelpers.ctaButton("View My Points", BRAND_URL)}
    `,
    footerNote:
      "This is an automated notification about your Legacy Keeper rewards balance.",
  });

  await sendEmail({
    to: email,
    subject: `You've received ${assignedPoints} points from Legacy Keeper`,
    html,
  });
};

type ConvertPointsStatusEmailParams = {
  name: string;
  email: string;
  status: "approved" | "rejected";
  amount: number;
  walletAddress: string;
  requestId: string;
};

export const sendConvertPointsStatusEmail = async ({
  name,
  email,
  status,
  amount,
  walletAddress,
  requestId,
}: ConvertPointsStatusEmailParams): Promise<void> => {
  const isApproved = status === "approved";

  const intro = isApproved
    ? `Your coin conversion request has been ${emailHelpers.highlight("approved")} by Legacy Keeper. The requested points were reserved when you submitted this request and will now be processed for conversion.`
    : `Your coin conversion request has been ${emailHelpers.highlight("rejected")} by Legacy Keeper. The ${amount} points reserved for this request have been ${emailHelpers.highlight("refunded")} back to your account.`;

  const footerNote = isApproved
    ? "If you have questions about your conversion, please contact Legacy Keeper support."
    : "Your points balance has been restored. You may submit a new conversion request from the Legacy Keeper app.";

  const html = buildEmailTemplate({
    preheader: isApproved
      ? `Your conversion request for ${amount} coins was approved`
      : `Your conversion request for ${amount} coins was rejected`,
    greeting: `Hello ${name}!`,
    body: `
      ${emailHelpers.paragraph(intro)}
      ${emailHelpers.statusBadge(status)}
      ${emailHelpers.infoCard([
        { label: "Coins requested", value: String(amount) },
        { label: "Solana wallet", value: walletAddress },
        { label: "Request ID", value: requestId },
        {
          label: "Status",
          value: isApproved ? "Approved" : "Rejected",
        },
      ])}
      ${
        isApproved
          ? emailHelpers.paragraph(
              "Your conversion is being processed. Please allow some time for the transfer to complete.",
            )
          : emailHelpers.paragraph(
              "If you believe this was a mistake, please reach out to our support team.",
            )
      }
      ${emailHelpers.ctaButton("Open Legacy Keeper", BRAND_URL)}
    `,
    footerNote,
  });

  await sendEmail({
    to: email,
    subject: isApproved
      ? `Conversion approved — ${amount} coins`
      : `Conversion request update — ${amount} coins`,
    html,
  });
};

export const verifyPassword = async (
  inputPassword: string,
  storedPassword: string,
): Promise<boolean> => {
  try {
    return await argon2.verify(storedPassword, inputPassword);
  } catch (error) {
    throw new Error("Password verification failed");
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await argon2.hash(password);
  } catch (error) {
    throw new Error("Password hashing failed");
  }
};

export const generateOTP = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

export const saveOTP = async (email: string, otp: string): Promise<void> => {
  await OTPModel.findOneAndUpdate(
    { email },
    { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    { upsert: true, new: true },
  );
};

export const findUserByEmail = async (email: string): Promise<IUser | null> => {
  return UserModel.findOne({ email });
};

export const findUserById = async (id: string): Promise<IUser | null> => {
  return UserModel.findById(id);
};
