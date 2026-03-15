import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "./auth";

// ─── API Response Helpers ─────────────────────────────────────────────────────

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ─── Route Handler Wrapper ────────────────────────────────────────────────────

type RouteHandler = (
  req: NextRequest,
  context: any
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with centralized error handling.
 * - Catches ApiError instances (thrown by requireAuth and validation helpers)
 * - Catches Prisma / ZodErrors and returns clean JSON responses
 * - Prevents stack traces leaking to the client in production
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(err.message, err.statusCode);
      }

      // Prisma unique constraint violation
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code?: string }).code === "P2002"
      ) {
        return errorResponse("A record with that value already exists", 409);
      }

      console.error("[API Error]", err);
      const message = err instanceof Error ? err.message : "Internal server error";
      return errorResponse(message, 500);
    }
  };
}

// ─── Pagination Helper ────────────────────────────────────────────────────────

export function getPaginationParams(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10))
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
