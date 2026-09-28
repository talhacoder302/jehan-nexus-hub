import { z } from "zod";
import { USER_ROLES } from "@/lib/constants";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Use at most 128 characters")
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), "Include at least one letter and one number");

export const loginSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password").max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

const tokenSchema = z.string().min(20).max(200);

export const resetPasswordSchema = z
  .object({
    token: tokenSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const acceptInviteSchema = z
  .object({
    token: tokenSchema,
    name: z.string().trim().min(2, "Enter your name").max(120),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const inviteUserSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a name").max(120),
    email: z.email("Enter a valid email").trim().toLowerCase(),
    role: z.enum(USER_ROLES),
    clientId: objectId.optional().or(z.literal("").transform(() => undefined)),
  })
  .refine((v) => v.role !== "client" || !!v.clientId, {
    path: ["clientId"],
    message: "Client users must be linked to a client",
  });
export type InviteUserInput = z.input<typeof inviteUserSchema>;
export type InviteUserValues = z.output<typeof inviteUserSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
});
export type ProfileInput = z.infer<typeof profileSchema>;
