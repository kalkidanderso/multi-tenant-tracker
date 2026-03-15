import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { successResponse, withErrorHandler } from "@/lib/api";
import { validateBody, RegisterSchema } from "@/lib/validation";
import { ApiError } from "@/lib/auth";

/**
 * POST /api/auth/register
 *
 * Creates a new Organization + Owner user in a single transaction.
 * This is the tenant "bootstrap" endpoint — the first user becomes the OWNER.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await validateBody(req, RegisterSchema);

  // Check slug uniqueness (friendly error before DB constraint)
  const existing = await prisma.organization.findUnique({
    where: { slug: body.orgSlug },
  });
  if (existing) {
    throw new ApiError(409, `Organization slug "${body.orgSlug}" is already taken`);
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  // Atomic: org + owner user created together
  const { org, user } = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: body.orgName, slug: body.orgSlug },
    });

    const user = await tx.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        role: "OWNER",
        organizationId: org.id,
      },
    });

    return { org, user };
  });

  const token = signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: org.id,
    organizationSlug: org.slug,
  });

  return successResponse(
    {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      organization: { id: org.id, name: org.name, slug: org.slug },
    },
    201
  );
});
