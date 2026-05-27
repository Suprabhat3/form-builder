import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { formRouter } from "./routes/forms/route";
import { adminRouter } from "./routes/admin/route";
import { billingRouter } from "./routes/billing/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  form: formRouter,
  admin: adminRouter,
  billing: billingRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
