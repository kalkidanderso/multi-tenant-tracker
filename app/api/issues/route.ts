import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError } from "@/lib/auth";
import {
  successResponse,
  withErrorHandler,
  getPaginationParams,
} from "@/lib/api";
import { validateBody, CreateIssueSchema } from "@/lib/validation";

/**
 * GET /api/issues
 *
 * Lists issues for the organization with powerful filtering:
 * - ?projectId=uuid
 * - ?status=OPEN|IN_PROGRESS|IN_REVIEW|DONE|CLOSED
 * - ?priority=LOW|MEDIUM|HIGH|CRITICAL
 * - ?assignedToId=uuid
 * - ?page=1&limit=20
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const authUser = requireAuth(req);
  const url = new URL(req.url);
  const { skip, limit, page } = getPaginationParams(req);

  const projectId = url.searchParams.get("projectId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const priority = url.searchParams.get("priority") ?? undefined;
  const assignedToId = url.searchParams.get("assignedToId") ?? undefined;
  const search = url.searchParams.get("q") ?? undefined;

  const where = {
    organizationId: authUser.organizationId,
    ...(projectId && { projectId }),
    ...(status && { status: status as never }),
    ...(priority && { priority: priority as never }),
    ...(assignedToId && { assignedToId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.issue.count({ where }),
  ]);

  return successResponse({ issues, total, page, limit });
});

/**
 * POST /api/issues
 * Creates a new issue. All authenticated users can create issues.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = requireAuth(req);
  const body = await validateBody(req, CreateIssueSchema);

  // Verify project belongs to the same org
  const project = await prisma.project.findFirst({
    where: { id: body.projectId, organizationId: authUser.organizationId },
  });
  if (!project) throw new ApiError(404, "Project not found");

  // Verify assignee (if provided) belongs to same org
  if (body.assignedToId) {
    const assignee = await prisma.user.findFirst({
      where: { id: body.assignedToId, organizationId: authUser.organizationId },
    });
    if (!assignee) throw new ApiError(400, "Assignee not found in this organization");
  }

  const issue = await prisma.issue.create({
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      projectId: body.projectId,
      organizationId: authUser.organizationId,
      createdById: authUser.id,
      assignedToId: body.assignedToId ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      tags: {
        create: body.tagIds.map((tagId) => ({ tagId })),
      },
    },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
    },
  });

  return successResponse({ issue }, 201);
});
