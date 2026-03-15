import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError } from "@/lib/auth";
import { successResponse, withErrorHandler } from "@/lib/api";
import { validateBody, CreateCommentSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/issues/[issueId]/comments
 * Retrieves all comments for a specific issue.
 */
export const GET = withErrorHandler(async (req: NextRequest, ctx: Ctx) => {
  const authUser = requireAuth(req);
  const { id: issueId } = await ctx.params;

  // Verify issue exists and belongs to the org
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, organizationId: authUser.organizationId },
  });
  if (!issue) throw new ApiError(404, "Issue not found");

  const comments = await prisma.comment.findMany({
    where: { issueId, organizationId: authUser.organizationId },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return successResponse({ comments });
});

/**
 * POST /api/issues/[issueId]/comments
 * Adds a new comment to an issue.
 */
export const POST = withErrorHandler(async (req: NextRequest, ctx: Ctx) => {
  const authUser = requireAuth(req);
  const { id: issueId } = await ctx.params;

  // Verify issue exists and belongs to the org
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, organizationId: authUser.organizationId },
  });
  if (!issue) throw new ApiError(404, "Issue not found");

  const body = await validateBody(req, CreateCommentSchema);

  const comment = await prisma.comment.create({
    data: {
      body: body.body,
      issueId,
      authorId: authUser.id,
      organizationId: authUser.organizationId,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return successResponse({ comment }, 201);
});
