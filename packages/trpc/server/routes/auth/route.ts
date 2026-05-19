import { z, zodUndefinedModel } from "../../schema";
import { userService } from "../../services";
import { getAuthenticationMethodOutputSchema } from "@repo/services/user/model";
import { authService } from "@repo/services/auth";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { TRPCError } from "@trpc/server";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

const authTokensOutputSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    image: z.string().nullable(),
    emailVerified: z.boolean(),
  }),
});

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
    .input(z.object({ email: z.string().email() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await authService.sendEmailVerificationOtp(input.email);
      return { success: true };
    }),

  verifyEmailByCode: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/email/verify-code"), tags: TAGS } })
    .input(z.object({ email: z.string().email(), otp: z.string().length(6) }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await authService.verifyEmailOtp(input.email, input.otp);
      return { success: true };
    }),

  signUpWithEmail: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/signup/email"), tags: TAGS } })
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        otp: z.string().length(6),
      }),
    )
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
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      }),
    )
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
    .input(z.object({ code: z.string().min(1) }))
    .output(authTokensOutputSchema)
    .mutation(async ({ input }) => {
      try {
        return await authService.signInWithGoogleAuthCode(input.code);
      } catch (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: (error as Error).message });
      }
    }),

  me: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/me"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(
      z.object({
        id: z.string(),
        email: z.string().email(),
        name: z.string(),
        image: z.string().nullable(),
        emailVerified: z.boolean(),
      }),
    )
    .query(({ ctx }) => ctx.user),
});
