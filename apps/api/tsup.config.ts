import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  // Bundle workspace packages so Railway does not need pnpm symlinks for @repo/*.
  noExternal: [/^@repo\//],
  // Keep npm deps external — bundling resend/svix/winston breaks at runtime when minified.
  external: [
    "express",
    "cors",
    "@trpc/server",
    "@trpc/server/adapters/express",
    "trpc-to-openapi",
    "@scalar/express-api-reference",
    "resend",
    "pg",
    "drizzle-orm",
    "drizzle-orm/node-postgres",
    "bcryptjs",
    "google-auth-library",
    "jsonwebtoken",
    "winston",
    "zod",
    "dotenv",
    "dotenv/config",
  ],
  splitting: false,
  bundle: true,
  outDir: "./dist",
  clean: true,
  env: { IS_SERVER_BUILD: "true" },
  loader: { ".json": "copy" },
  minify: false,
  sourcemap: false,
});
