import { Request, Response, NextFunction } from "express";

/**
 * Recursively scans an object for keys starting with '$' or containing '.'
 * to prevent NoSQL query injection attacks.
 */
const hasNoSqlKeys = (obj: unknown): boolean => {
  if (!obj || typeof obj !== "object") return false;
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key.startsWith("$") || key.includes(".")) return true;
    if (typeof record[key] === "object" && hasNoSqlKeys(record[key])) return true;
  }
  return false;
};

/**
 * Middleware to protect against NoSQL Injection.
 * Scans req.body, req.query, and req.params and blocks requests with malicious patterns.
 */
export const noSqlInjectionGuard = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (
    hasNoSqlKeys(req.body) ||
    hasNoSqlKeys(req.query) ||
    hasNoSqlKeys(req.params)
  ) {
    return res.status(400).json({
      success: false,
      message: "Malicious request detected: NoSQL key markers are not allowed.",
    });
  }
  next();
};

/**
 * Middleware to enforce standard secure HTTP headers on all API responses.
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  next();
};
