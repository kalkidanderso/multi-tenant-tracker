import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError } from "@/lib/auth";
import { successResponse, withErrorHandler } from "@/lib/api";
import { validateBody, UpdateProjectSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/[id]
 * Retrieves a single project by ID, scoped to the user's organization.
 */
export const GET = withErrorHandler(async (req: NextRequest, ctx: Ctx) => {
  const authUser = requireAuth(req);
  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: authUser.organizationId },
    include: {
      _count: { select: { issues: true } },
    },
  });

  if (!project) throw new ApiError(404, "Project not found");

  return successResponse({ project });
});

/**
 * PATCH /api/projects/[id]
 * Updates a project. Only OWNER or ADMIN can update.
 */
export const PATCH = withErrorHandler(async (req: NextRequest, ctx: Ctx) => {
  const authUser = requireAuth(req);
  const { id } = await ctx.params;

  if (!["OWNER", "ADMIN"].includes(authUser.role)) {
    throw new ApiError(403, "Only OWNER or ADMIN can update projects");
  }

  // Verify project belongs to org
  const existing = await prisma.project.findFirst({
    where: { id, organizationId: authUser.organizationId },
  });
  if (!existing) throw new ApiError(404, "Project not found");

  const body = await validateBody(req, UpdateProjectSchema);

  const project = await prisma.project.update({
    where: { id },
    data: body,
  });

  return successResponse({ project });
});

/**
 * DELETE /api/projects/[id]
 * Deletes a project. Only OWNER can delete a project (cascades issues).
 */
export const DELETE = withErrorHandler(async (req: NextRequest, ctx: Ctx) => {
  const authUser = requireAuth(req);
  const { id } = await ctx.params;

  if (authUser.role !== "OWNER") {
    throw new ApiError(403, "Only OWNER can delete projects");
  }

  const existing = await prisma.project.findFirst({
    where: { id, organizationId: authUser.organizationId },
  });
  if (!existing) throw new ApiError(404, "Project not found");

  await prisma.project.delete({ where: { id } });

  return successResponse({ deleted: true });
});
