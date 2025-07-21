"use server";

import { createMiddleware, createServerFn } from "@tanstack/react-start";

const queryMutationRequestMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next, router }) => {
    console.log("Router", router);

    return await next({
      sendContext: {
        queriesToRevalidate: { queryA: true, queryB: true },
      },
    });
  })
  .server(async ({ next, context }) => {
    // read which queries to revalidate, that were sent from the client
    console.log("Queries to revalidate 2", context.queriesToRevalidate);

    const updatedQueries: Record<string, any> = {};

    const value = await next({
      sendContext: {
        updatedQueries,
      },
    });

    // FETCH NEW QUERY DATA
    value.sendContext.updatedQueries.queryA = { data: "hello 1" };
    value.sendContext.updatedQueries.queryB = { data: "hello 2" };

    return value;
  });

const queryMutationResponseMiddleware = createMiddleware({ type: "function" })
  .middleware([queryMutationRequestMiddleware])
  .client(async ({ next }) => {
    const result = await next();

    const updatedQueries = result.context.updatedQueries;

    console.log({ updatedQueries });

    return result;
  });

export const callServerFn2 = createServerFn()
  .middleware([queryMutationResponseMiddleware])
  .handler(async () => {
    return { value: new Date().toISOString() };
  });
