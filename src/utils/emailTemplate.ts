import fs from "fs";
import path from "path";
import { BRAND_URL, EMAIL_LOGO_URL } from "../config";

const APP_NAME = process.env.AppName || "Legacy Keeper";
export const EMAIL_LOGO_CID = "legacyKeeperLogo@legacykeeper";
const LOGO_FILE_PATH = path.resolve(
  process.cwd(),
  process.env.EMAIL_LOGO_PATH || "public/images/logo.png",
);

const usesExternalLogo = (): boolean => EMAIL_LOGO_URL.startsWith("https://");

/** CID attachment — most reliable way to show logos in Gmail/Outlook. */
export const getEmailLogoAttachments = () => {
  if (usesExternalLogo()) return [];

  if (!fs.existsSync(LOGO_FILE_PATH)) {
    console.warn(`Email logo not found at: ${LOGO_FILE_PATH}`);
    return [];
  }

  return [
    {
      filename: "logo.png",
      path: LOGO_FILE_PATH,
      cid: EMAIL_LOGO_CID,
    },
  ];
};

const getEmailLogoSrc = (): string => {
  if (usesExternalLogo()) return EMAIL_LOGO_URL;
  return `cid:${EMAIL_LOGO_CID}`;
};

type EmailTemplateOptions = {
  preheader?: string;
  greeting?: string;
  body: string;
  footerNote?: string;
};

const otpBlock = (otp: string, label = "Your verification code") => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
    <tr>
      <td align="center">
        <p style="margin: 0 0 10px; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b;">
          ${label}
        </p>
        <div style="display: inline-block; padding: 18px 28px; background: linear-gradient(135deg, #0066cc 0%, #0099ff 100%); border-radius: 14px; box-shadow: 0 10px 24px rgba(0, 102, 204, 0.22);">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 0.35em; color: #ffffff;">
            ${otp}
          </span>
        </div>
        <p style="margin: 14px 0 0; font-size: 13px; color: #dc2626; font-weight: 600;">
          Expires in 3 minutes
        </p>
      </td>
    </tr>
  </table>
`;

const ctaButton = (label: string, href: string) => `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px auto;">
    <tr>
      <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #0066cc 0%, #0099ff 100%);">
        <a href="${href}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.02em;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
`;

const pointsBadge = (points: number) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
    <tr>
      <td align="center">
        <div style="display: inline-block; padding: 22px 36px; background: linear-gradient(135deg, #0066cc 0%, #0099ff 100%); border-radius: 16px; box-shadow: 0 12px 28px rgba(0, 102, 204, 0.25);">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.88);">Points awarded</p>
          <p style="margin: 0; font-size: 44px; font-weight: 800; color: #ffffff; line-height: 1;">+${points}</p>
        </div>
      </td>
    </tr>
  </table>
`;

const reasonBox = (reason: string) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
      <td style="padding: 18px 22px; background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%); border-left: 4px solid #0066cc; border-radius: 0 12px 12px 0;">
        <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b;">Reason from Legacy Keeper</p>
        <p style="margin: 0; font-size: 16px; line-height: 1.65; color: #0f172a;">${reason}</p>
      </td>
    </tr>
  </table>
`;

const statusBadge = (status: "approved" | "rejected") => {
  const isApproved = status === "approved";
  const background = isApproved
    ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
    : "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)";
  const label = isApproved ? "Request Approved" : "Request Rejected";
  const shadow = isApproved
    ? "rgba(5, 150, 105, 0.25)"
    : "rgba(220, 38, 38, 0.25)";

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
    <tr>
      <td align="center">
        <div style="display: inline-block; padding: 16px 28px; background: ${background}; border-radius: 14px; box-shadow: 0 10px 24px ${shadow};">
          <p style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: #ffffff;">
            ${label}
          </p>
        </div>
      </td>
    </tr>
  </table>
`;
};

const infoCard = (rows: { label: string; value: string }[]) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    ${rows
      .map(
        (row, index) => `
      <tr>
        <td style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #64748b; width: 38%; vertical-align: top;${index < rows.length - 1 ? " border-bottom: 1px solid #e2e8f0;" : ""}">
          ${row.label}
        </td>
        <td style="padding: 14px 20px; font-size: 15px; color: #0f172a; font-weight: 500; word-break: break-all;${index < rows.length - 1 ? " border-bottom: 1px solid #e2e8f0;" : ""}">
          ${row.value}
        </td>
      </tr>`,
      )
      .join("")}
  </table>
`;

export const buildEmailTemplate = ({
  preheader = "",
  greeting = "Hello",
  body,
  footerNote = "If you did not request this email, you can safely ignore it.",
}: EmailTemplateOptions): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);">
          <tr>
            <td style="padding: 36px 32px 28px; background: #ffffff; text-align: center; border-bottom: 1px solid #e2e8f0;">
              <img src="${getEmailLogoSrc()}" alt="${APP_NAME}" width="140" style="display: block; margin: 0 auto; max-width: 140px; height: auto; border: 0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px 28px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; line-height: 1.35; color: #0f172a; font-weight: 700;">
                ${greeting}
              </h2>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #475569; text-align: center;">
                ${footerNote}
              </p>
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME} ·
                <a href="${BRAND_URL}" style="color: #0066cc; text-decoration: none; font-weight: 600;">${BRAND_URL.replace(/^https?:\/\//, "")}</a>
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; font-style: italic;">
                Because your final wishes matter.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const emailHelpers = {
  otpBlock,
  ctaButton,
  pointsBadge,
  reasonBox,
  statusBadge,
  infoCard,
  paragraph: (text: string) =>
    `<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: #334155;">${text}</p>`,
  highlight: (text: string) =>
    `<strong style="color: #0066cc;">${text}</strong>`,
};
