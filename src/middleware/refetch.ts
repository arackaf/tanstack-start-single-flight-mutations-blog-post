import { createMiddleware } from "@tanstack/react-start";
import { QueryKey, hashKey, partialMatchKey } from "@tanstack/react-query";

type RevalidationPayload = {
  invalidate: any[];
  refetch: {
    key: any;
    fn: any;
    args: any;
  }[];
};

type RefetchMiddlewareConfig = {
  refetch?: QueryKey[];
  refetchIfActive?: QueryKey[];
  invalidate?: QueryKey[];
};
export const refetchMiddleware = (config: RefetchMiddlewareConfig) =>
  createMiddleware({ type: "function" })
    .client(async ({ next, context, router }) => {
      console.log("--------------------------------\n");
      console.log(partialMatchKey(["epics", "list", 1], ["epics", "list"]));
      console.log(partialMatchKey(["epics", "list"], ["epics", "list", 1]));
      console.log(partialMatchKey(["epics", "list", 1], ["epics", "list", 1]));
      console.log("--------------------------------\n");
      const { refetch = [], refetchIfActive = [], invalidate = [] } = config;

      const revalidate: RevalidationPayload = {
        invalidate: [],
        refetch: []
      };
      const allKeys = [...refetch, ...refetchIfActive, ...invalidate];

      const queryClient = router.options.context.queryClient;
      const cache = queryClient.getQueryCache();

      const allQueriesFound = [
        ...new Map(
          allKeys.flatMap(key =>
            queryClient.getQueriesData({ queryKey: key, exact: false }).map(entry => [hashKey(entry[0]), entry])
          )
        ).values()
      ];

      console.log({ allQueriesFound });
      allQueriesFound.forEach(query => {
        const key = query[0];
        const entry = cache.find({ queryKey: key, exact: true });
        const isActive = !!entry?.observers?.length;
        const revalidatePayload: any = entry?.options?.meta?.__revalidate ?? null;

        console.log({ key: key.join("-"), isActive });
        console.log({ keyHashed: hashKey(key) });

        if (revalidatePayload) {
          if (refetch.some(refetchKey => partialMatchKey(key, refetchKey))) {
            revalidate.refetch.push({
              key,
              fn: revalidatePayload.serverFn,
              args: revalidatePayload.args
            });
          } else if (isActive && refetchIfActive.some(refetchKey => partialMatchKey(key, refetchKey))) {
            revalidate.refetch.push({
              key,
              fn: revalidatePayload.serverFn,
              args: revalidatePayload.args
            });
          } else {
            revalidate.invalidate.push(key);
          }
        } else {
          revalidate.invalidate.push(key);
        }
      });

      const result = await next({
        sendContext: {
          revalidate
        }
      });

      return result;
    })
    .server(async ({ next, context }) => {
      const result = await next({
        sendContext: {
          payloads: {} as any
        }
      });

      console.log("context", context);
      for (const refetchPayload of context.revalidate.refetch) {
        const results = await refetchPayload.fn({ data: refetchPayload.args });
        console.log({ key: refetchPayload.key, results });

        result.sendContext.payloads[refetchPayload.key] = results;
      }

      return result;
    });
