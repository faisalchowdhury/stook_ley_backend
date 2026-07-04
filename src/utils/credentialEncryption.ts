import crypto from "crypto";
import { CREDENTIAL_ENCRYPTION_KEY, JWT_SECRET_KEY } from "../config";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const PREFIX = "enc:";

const getEncryptionKey = (): Buffer => {
  const secret =
    CREDENTIAL_ENCRYPTION_KEY ||
    JWT_SECRET_KEY ||
    "legacy-keeper-dev-key";
  return crypto.createHash("sha256").update(secret).digest();
};

export const encryptCredential = (plainText: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64");
  return `${PREFIX}${payload}`;
};

export const decryptCredential = (stored: string): string | null => {
  if (!stored.startsWith(PREFIX)) return null;

  try {
    const data = Buffer.from(stored.slice(PREFIX.length), "base64");
    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      iv,
    );
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
};

export const isEncryptedCredential = (stored: string): boolean =>
  stored.startsWith(PREFIX);

/** Encrypt only when the value is still plain text. */
export const encryptCredentialIfNeeded = (value: string): string => {
  if (isEncryptedCredential(value)) return value;
  return encryptCredential(value);
};

/** Return the original plain-text credential from DB storage. */
export const resolveStoredCredential = (
  stored?: string | null,
): string | null => {
  if (!stored) return null;

  const decrypted = decryptCredential(stored);
  if (decrypted) return decrypted;

  if (isEncryptedCredential(stored)) {
    return null;
  }

  return stored;
};
