import { createMiddleware } from "@tanstack/react-start";
import { QueryKey } from "@tanstack/react-query";

export const refetchMiddleware = (queryKey: QueryKey | QueryKey[]) =>
  createMiddleware({ type: "function" })
    .client(async ({ next, context, router }) => {
      const allKeys = Array.isArray(queryKey) ? queryKey : [queryKey];
      const queryClient = router.options.context.queryClient;

      const allQueriesFound = allKeys.flatMap(key => queryClient.getQueriesData({ queryKey: key, exact: false }));
      console.log("queriesFound", allQueriesFound);

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
