import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError } from "@/lib/auth";
import { successResponse, withErrorHandler } from "@/lib/api";
import { validateBody, CreateTagSchema } from "@/lib/validation";

/**
 * GET /api/tags
 * Lists all tags for a tenant's organization.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const authUser = requireAuth(req);

  const tags = await prisma.tag.findMany({
    where: { organizationId: authUser.organizationId },
    orderBy: { name: "asc" },
  });

  return successResponse({ tags });
});

/**
 * POST /api/tags
 * Creates a new tag for the tenant's organization.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = requireAuth(req);

  const body = await validateBody(req, CreateTagSchema);

  // Friendly error for uniqueness
  const existing = await prisma.tag.findFirst({
    where: { name: body.name, organizationId: authUser.organizationId },
  });
  if (existing) {
    throw new ApiError(409, `Tag "${body.name}" already exists`);
  }

  const tag = await prisma.tag.create({
    data: {
      name: body.name,
      color: body.color,
      organizationId: authUser.organizationId,
    },
  });

  return successResponse({ tag }, 201);
});
