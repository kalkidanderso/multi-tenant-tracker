import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;          // userId
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organizationSlug: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organizationSlug: string;
}

// ─── Token Signing ────────────────────────────────────────────────────────────

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");

  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) ?? "7d",
  });
}

// ─── Token Verification ───────────────────────────────────────────────────────

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");

  return jwt.verify(token, secret) as JwtPayload;
}

// ─── Request Auth Extraction ─────────────────────────────────────────────────

/**
 * Extracts and verifies the Bearer JWT from an incoming request.
 * Returns null if the token is missing or invalid.
 */
export function getAuthUser(req: NextRequest): AuthUser | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      organizationId: payload.organizationId,
      organizationSlug: payload.organizationSlug,
    };
  } catch {
    return null;
  }
}

/**
 * Throws a 401 response if no valid auth token is present.
 * Use in API routes for clean, DRY auth enforcement.
 */
export function requireAuth(req: NextRequest): AuthUser {
  const user = getAuthUser(req);
  if (!user) {
    throw new ApiError(401, "Unauthorized: valid Bearer token required");
  }
  return user;
}

// ─── Custom API Error ─────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
