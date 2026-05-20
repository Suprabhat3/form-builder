import { z, zodUndefinedModel } from "../../schema";
import { userService } from "../../services";
import { getAuthenticationMethodOutputSchema } from "@repo/services/user/model";
import { authService } from "@repo/services/auth";
import {
  authTokensOutputSchema,
  authUserSchema,
  refreshSessionInputSchema,
  sendEmailVerificationInputSchema,
  signOutInputSchema,
  signInWithEmailInputSchema,
  signInWithGoogleInputSchema,
  signUpWithEmailInputSchema,
  verifyEmailByCodeInputSchema,
} from "@repo/services/auth/model";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { TRPCError } from "@trpc/server";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  getSupportedAuthenticationProviders: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/supported-providers"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.readonly(z.array(getAuthenticationMethodOutputSchema)))
    .query(async () => {
      return userService.getAuthenticationMethods();
    }),

  sendEmailVerificationCode: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/email/send-verification-code"), tags: TAGS } })
    .input(sendEmailVerificationInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await authService.sendEmailVerificationOtp(input.email);
      return { success: true };
    }),

  verifyEmailByCode: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/email/verify-code"), tags: TAGS } })
    .input(verifyEmailByCodeInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await authService.verifyEmailOtp(input.email, input.otp);
      return { success: true };
    }),

  signUpWithEmail: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/signup/email"), tags: TAGS } })
    .input(signUpWithEmailInputSchema)
    .output(authTokensOutputSchema)
    .mutation(async ({ input }) => {
      try {
        return await authService.signUpWithEmail(input);
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: (error as Error).message });
      }
    }),

  signInWithEmail: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/signin/email"), tags: TAGS } })
    .input(signInWithEmailInputSchema)
    .output(authTokensOutputSchema)
    .mutation(async ({ input }) => {
      try {
        return await authService.signInWithEmail(input);
      } catch (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: (error as Error).message });
      }
    }),

  signInWithGoogle: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/signin/google"), tags: TAGS } })
    .input(signInWithGoogleInputSchema)
    .output(authTokensOutputSchema)
    .mutation(async ({ input }) => {
      try {
        return await authService.signInWithGoogleAuthCode(input.code);
      } catch (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: (error as Error).message });
      }
    }),

  refreshSession: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/refresh"), tags: TAGS } })
    .input(refreshSessionInputSchema)
    .output(authTokensOutputSchema)
    .mutation(async ({ input }) => {
      try {
        return await authService.refreshSession(input.refreshToken);
      } catch (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: (error as Error).message });
      }
    }),

  signOut: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/signout"), tags: TAGS } })
    .input(signOutInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await authService.signOut(input.refreshToken);
      return { success: true };
    }),

  me: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/me"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(authUserSchema)
    .query(({ ctx }) => ctx.user),
});
