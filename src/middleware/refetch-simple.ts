import { createMiddleware, getRouterInstance } from "@tanstack/react-start";
import { QueryClient } from "@tanstack/react-query";
import { getEpicsList } from "@/serverFn/epics";

export const epicsListRefetchMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const router = await getRouterInstance();

    const queryClient: QueryClient = router.options.context.queryClient;
    const cache = queryClient.getQueryCache();

    const result = await next();

    console.log("epicsListRefetchMiddleware client", { result });

    return result;
  })
  .server(async ({ next, context }) => {
    const result = await next({
      sendContext: {
        payload: {} as any
      }
    });

    result.sendContext.payload.a = 12;

    const epics = await getEpicsList({ data: 1 });

    return result;
  });
