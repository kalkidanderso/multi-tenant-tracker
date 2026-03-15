import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError } from "@/lib/auth";
import {
  successResponse,
  withErrorHandler,
  getPaginationParams,
} from "@/lib/api";
import { validateBody, CreateProjectSchema, UpdateProjectSchema } from "@/lib/validation";

/**
 * GET /api/projects
 * Lists all projects for the authenticated user's organization.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const authUser = requireAuth(req);
  const { skip, limit, page } = getPaginationParams(req);

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: authUser.organizationId },
      include: {
        _count: { select: { issues: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.project.count({ where: { organizationId: authUser.organizationId } }),
  ]);

  return successResponse({ projects, total, page, limit });
});

/**
 * POST /api/projects
 * Creates a new project in the authenticated user's organization.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = requireAuth(req);

  if (!["OWNER", "ADMIN"].includes(authUser.role)) {
    throw new ApiError(403, "Only OWNER or ADMIN can create projects");
  }

  const body = await validateBody(req, CreateProjectSchema);

  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description,
      organizationId: authUser.organizationId,
    },
  });

  return successResponse({ project }, 201);
});
