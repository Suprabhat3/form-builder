import { z } from "zod";

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  image: z.string().nullable(),
  emailVerified: z.boolean(),
  role: z.enum(["USER", "ADMIN"]),
});

export const authTokensOutputSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: authUserSchema,
});

export const sendEmailVerificationInputSchema = z.object({
  email: z.string().email(),
});

export const verifyEmailByCodeInputSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const signUpWithEmailInputSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  otp: z.string().length(6),
});

export const signInWithEmailInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const signInWithGoogleInputSchema = z.object({
  code: z.string().min(1),
});

export const refreshSessionInputSchema = z.object({
  refreshToken: z.string().min(1),
});

export const signOutInputSchema = z.object({
  refreshToken: z.string().min(1),
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthTokensOutput = z.infer<typeof authTokensOutputSchema>;
export type SignUpWithEmailInput = z.infer<typeof signUpWithEmailInputSchema>;
export type SignInWithEmailInput = z.infer<typeof signInWithEmailInputSchema>;
export type SignOutInput = z.infer<typeof signOutInputSchema>;
