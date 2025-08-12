import { createMiddleware } from "@tanstack/react-start";
import { QueryKey } from "@tanstack/react-query";

export const refetchMiddleware = (queryKey: QueryKey | QueryKey[]) =>
  createMiddleware({ type: "function" })
    .client(async ({ next, context, router }) => {
      const allKeys = Array.isArray(queryKey) ? queryKey : [queryKey];
      const queryClient = router.options.context.queryClient;
      const cache = queryClient.getQueryCache();

      const allQueriesFound = allKeys.flatMap(key => queryClient.getQueriesData({ queryKey: key, exact: false }));
      //console.log("queriesFound", allQueriesFound);
      allQueriesFound.forEach(query => {
        const key = query[0];
        const entry = cache.find({ queryKey: key, exact: true });
        const isActive = !!entry?.observers?.length;
        console.log({ key: key.join("-"), isActive });
      });

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
