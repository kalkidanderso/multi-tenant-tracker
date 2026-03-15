import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { successResponse, withErrorHandler } from "@/lib/api";

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile from the JWT.
 * No DB hit — all data is already in the token payload.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = requireAuth(req);
  return successResponse({ user });
});
