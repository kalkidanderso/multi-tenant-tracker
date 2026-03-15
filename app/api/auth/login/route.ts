import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { successResponse, withErrorHandler } from "@/lib/api";
import { validateBody, LoginSchema } from "@/lib/validation";
import { ApiError } from "@/lib/auth";

/**
 * POST /api/auth/login
 *
 * Authenticates a user within a specific tenant (orgSlug).
 * Email uniqueness is per-tenant, not global — requires orgSlug to scope lookup.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await validateBody(req, LoginSchema);

  // Resolve tenant
  const org = await prisma.organization.findUnique({
    where: { slug: body.orgSlug },
  });
  if (!org) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Scoped user lookup (email unique per org)
  const user = await prisma.user.findUnique({
    where: {
      email_organizationId: {
        email: body.email,
        organizationId: org.id,
      },
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const passwordMatch = await bcrypt.compare(body.password, user.passwordHash);
  if (!passwordMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: org.id,
    organizationSlug: org.slug,
  });

  return successResponse({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    organization: { id: org.id, name: org.name, slug: org.slug },
  });
});
