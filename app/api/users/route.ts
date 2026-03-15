import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAuth, ApiError } from "@/lib/auth";
import {
  successResponse,
  withErrorHandler,
  getPaginationParams,
} from "@/lib/api";
import { validateBody, InviteUserSchema } from "@/lib/validation";

/**
 * GET /api/users
 * Lists all users in the authenticated user's organization.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const authUser = requireAuth(req);
  const { skip, limit, page } = getPaginationParams(req);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: authUser.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: { organizationId: authUser.organizationId } }),
  ]);

  return successResponse({ users, total, page, limit });
});

/**
 * POST /api/users
 * Invites/creates a new user in the organization.
 * Only OWNER or ADMIN can invite users.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = requireAuth(req);

  if (!["OWNER", "ADMIN"].includes(authUser.role)) {
    throw new ApiError(403, "Only OWNER or ADMIN can invite users");
  }

  const body = await validateBody(req, InviteUserSchema);
  const passwordHash = await bcrypt.hash(body.password, 12);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      passwordHash,
      role: body.role,
      organizationId: authUser.organizationId,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return successResponse({ user }, 201);
});
