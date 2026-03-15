import { z, ZodSchema } from "zod";
import { ApiError } from "./auth";

// ─── Shared Validation Helper ─────────────────────────────────────────────────

/**
 * Parses and validates request body against a Zod schema.
 * Throws an ApiError(400) with formatted messages on validation failure.
 */
export async function validateBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    throw new ApiError(400, `Validation error — ${messages}`);
  }

  return result.data;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  orgName: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100),
  orgSlug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
  orgSlug: z.string().min(1, "Organization slug is required"),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const CreateIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  status: z
    .enum(["OPEN", "IN_PROGRESS", "IN_REVIEW", "DONE", "CLOSED"])
    .optional()
    .default("OPEN"),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional()
    .default("MEDIUM"),
  projectId: z.string().uuid("Invalid project ID"),
  assignedToId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional().default([]),
});

export const UpdateIssueSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "IN_REVIEW", "DONE", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const CreateCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(2000),
});

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex code")
    .optional()
    .default("#6366f1"),
});

export const InviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "MEMBER"]).optional().default("MEMBER"),
});
