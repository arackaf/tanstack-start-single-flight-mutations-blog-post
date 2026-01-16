import { createMiddleware, getRouterInstance } from "@tanstack/react-start";
import { QueryClient, QueryKey, hashKey, partialMatchKey } from "@tanstack/react-query";

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
};
export const refetchMiddleware = (config: RefetchMiddlewareConfig) =>
  createMiddleware({ type: "function" })
    .client(async ({ next }) => {
      const router = await getRouterInstance();

      const { refetch = [] } = config;

      const revalidate: RevalidationPayload = {
        invalidate: [],
        refetch: []
      };

      const queryClient: QueryClient = router.options.context.queryClient;
      const cache = queryClient.getQueryCache();

      const allQueriesFound = [
        ...new Map(
          refetch.flatMap(key =>
            queryClient.getQueriesData({ queryKey: key, exact: false }).map(entry => [hashKey(entry[0]), entry])
          )
        ).values()
      ];

      allQueriesFound.forEach(query => {
        const key = query[0];

        const entry = cache.find({ queryKey: key, exact: true });
        const isActive = !!entry?.observers?.length;
        const revalidatePayload: any = entry?.options?.meta?.__revalidate ?? null;

        if (revalidatePayload) {
          if (isActive && refetch.some(refetchKey => partialMatchKey(key, refetchKey))) {
            revalidate.refetch.push({
              key,
              fn: revalidatePayload.serverFn,
              args: revalidatePayload.args
            });
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

      // @ts-expect-error
      for (const invalidate of result.context?.invalidate ?? []) {
        queryClient.invalidateQueries({ queryKey: invalidate, exact: true });
      }

      // @ts-expect-error
      for (const entry of result.context?.payloads ?? []) {
        queryClient.setQueryData(entry.key, entry.result, { updatedAt: Date.now() });
      }

      return result;
    })
    .server(async ({ next, context }) => {
      const result = await next({
        sendContext: {
          payloads: [] as any[],
          invalidate: [] as any[]
        }
      });

      for (const refetchPayload of context.revalidate.refetch) {
        // TODO: make parallel
        const serverFnResult = await refetchPayload.fn({ data: refetchPayload.args });

        result.sendContext.payloads.push({
          key: refetchPayload.key,
          result: serverFnResult
        });
      }
      result.sendContext.invalidate.push(...context.revalidate.invalidate);

      return result;
    });
