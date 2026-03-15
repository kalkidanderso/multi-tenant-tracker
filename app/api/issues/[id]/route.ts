import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError } from "@/lib/auth";
import { successResponse, withErrorHandler } from "@/lib/api";
import { validateBody, UpdateIssueSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/issues/[id]
 * Retrieves a single issue with full relations. Tenant-scoped.
 */
export const GET = withErrorHandler(async (req: NextRequest, ctx: Ctx) => {
  const authUser = requireAuth(req);
  const { id } = await ctx.params;

  const issue = await prisma.issue.findFirst({
    where: { id, organizationId: authUser.organizationId },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!issue) throw new ApiError(404, "Issue not found");

  return successResponse({ issue });
});

/**
 * PATCH /api/issues/[id]
 * Updates an issue. Any tenant member can update issues.
 * Tag replacement: if tagIds provided, replaces all existing tags atomically.
 */
export const PATCH = withErrorHandler(async (req: NextRequest, ctx: Ctx) => {
  const authUser = requireAuth(req);
  const { id } = await ctx.params;

  const existing = await prisma.issue.findFirst({
    where: { id, organizationId: authUser.organizationId },
  });
  if (!existing) throw new ApiError(404, "Issue not found");

  const body = await validateBody(req, UpdateIssueSchema);

  // Validate assignee scope if provided
  if (body.assignedToId) {
    const assignee = await prisma.user.findFirst({
      where: { id: body.assignedToId, organizationId: authUser.organizationId },
    });
    if (!assignee) throw new ApiError(400, "Assignee not found in this organization");
  }

  const { tagIds, ...issueData } = body;

  const issue = await prisma.issue.update({
    where: { id },
    data: {
      ...issueData,
      ...(body.dueDate !== undefined && {
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      }),
      // Replace tags atomically
      ...(tagIds !== undefined && {
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        },
      }),
    },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
    },
  });

  return successResponse({ issue });
});

/**
 * DELETE /api/issues/[id]
 * Deletes an issue. OWNER/ADMIN or the issue creator can delete.
 */
export const DELETE = withErrorHandler(async (req: NextRequest, ctx: Ctx) => {
  const authUser = requireAuth(req);
  const { id } = await ctx.params;

  const existing = await prisma.issue.findFirst({
    where: { id, organizationId: authUser.organizationId },
  });
  if (!existing) throw new ApiError(404, "Issue not found");

  const canDelete =
    ["OWNER", "ADMIN"].includes(authUser.role) ||
    existing.createdById === authUser.id;

  if (!canDelete) {
    throw new ApiError(403, "You can only delete issues you created");
  }

  await prisma.issue.delete({ where: { id } });

  return successResponse({ deleted: true });
});
