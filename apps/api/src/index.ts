import http from "node:http";
import { logger } from "@repo/logger";
import { app as expressApplication } from "./server";

import { env } from "./env";

async function init() {
  try {
    const server = http.createServer(expressApplication);
    // Railway injects PORT; must listen on 0.0.0.0 (not localhost) for the proxy to reach us.
    const port = Number(process.env.PORT ?? env.PORT ?? 8000);
    const host = "0.0.0.0";
    server.listen(port, host, () => {
      logger.info(`http server is running on ${host}:${port}`);
    });
  } catch (err) {
    logger.error(`Error creating http server`, { err });
    process.exit(1);
  }
}

init();
