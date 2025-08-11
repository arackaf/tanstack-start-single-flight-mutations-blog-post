import { createMiddleware } from "@tanstack/react-start";

import { addLog } from "@/queries/logging";

export const loggingMiddleware = (name: string) =>
  createMiddleware({ type: "function" })
    .client(async ({ next, context }) => {
      console.log(name, "client", context);

      return next({
        sendContext: {
          traceId: crypto.randomUUID(),
          clientStart: new Date().toISOString()
        }
      });
    })
    .server(async ({ next, context }) => {
      const start = +new Date();
      const result = await next({});
      const end = +new Date();

      addLog(name, context.clientStart, context.traceId, end - start);

      return result;
    });
