import { createMiddleware } from "@tanstack/react-start";
import { addLog, setClientEnd } from "../serverFn/logging";
import { QueryKey } from "@tanstack/react-query";

export const refetchMiddleware = (queryKey: QueryKey) =>
  createMiddleware({ type: "function" })
    .client(async ({ next, context, router }) => {
      console.log("client", context);
      console.log("router", router);

      const result = await next({
        sendContext: {}
      });

      return result;
    })
    .server(async ({ next, context }) => {
      const result = await next({
        sendContext: {}
      });

      return result;
    });
