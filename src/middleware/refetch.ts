import { createMiddleware, getRouterInstance } from "@tanstack/react-start";
import { QueryClient, QueryKey, partialMatchKey } from "@tanstack/react-query";

type RevalidationPayload = {
  refetch: {
    key: any;
    fn: any;
    arg: any;
  }[];
};

export const refetchMiddleware_final = (config: RefetchMiddlewareConfig) =>
  createMiddleware({ type: "function" })
    .client(async ({ next }) => {
      const router = await getRouterInstance();

      const { refetch = [] } = config;

      const revalidate: RevalidationPayload = {
        refetch: []
      };

      const queryClient: QueryClient = router.options.context.queryClient;
      const cache = queryClient.getQueryCache();

      const allQueriesFound = refetch.flatMap(key => queryClient.getQueriesData({ queryKey: key, exact: false }));

      console.log({ allQueriesFound });

      allQueriesFound.forEach(query => {
        const key = query[0];

        const entry = cache.find({ queryKey: key, exact: true });
        const isActive = !!entry?.observers?.length;
        const revalidatePayload: any = entry?.options?.meta?.__revalidate ?? null;

        if (refetch.some(refetchKey => partialMatchKey(key, refetchKey))) {
          if (isActive && revalidatePayload) {
            revalidate.refetch.push({
              key,
              fn: revalidatePayload.serverFn,
              arg: revalidatePayload.arg
            });
          } else {
            // revalidate.invalidate.push(key);
          }
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
        const serverFnResult = await refetchPayload.fn({ data: refetchPayload.arg });

        result.sendContext.payloads.push({
          key: refetchPayload.key,
          result: serverFnResult
        });
      }
      // result.sendContext.invalidate.push(...context.revalidate.invalidate);

      return result;
    });

type RefetchMiddlewareConfig = {
  refetch: QueryKey[];
};

export const old_refetchMiddleware = createMiddleware({ type: "function" })
  .inputValidator((config?: RefetchMiddlewareConfig) => config)
  .client(async ({ next, data }) => {
    const { refetch = [] } = data ?? {};

    const router = await getRouterInstance();
    const queryClient: QueryClient = router.options.context.queryClient;
    const cache = queryClient.getQueryCache();

    const revalidate: RevalidationPayload = {
      refetch: []
    };

    refetch.forEach((key: QueryKey) => {
      const entry = cache.find({ queryKey: key, exact: true });
      if (!entry) return;

      const revalidatePayload: any = entry?.options?.meta?.__revalidate ?? null;

      if (revalidatePayload) {
        revalidate.refetch.push({
          key,
          fn: revalidatePayload.serverFn,
          arg: revalidatePayload.arg
        });
      }
    });

    const result = await next({
      sendContext: {
        revalidate
      }
    });

    // @ts-expect-error
    for (const entry of result.context?.payloads ?? []) {
      queryClient.setQueryData(entry.key, entry.result, { updatedAt: Date.now() });
    }

    return result;
  })
  .server(async ({ next, context }) => {
    const result = await next({
      sendContext: {
        payloads: [] as any[]
      }
    });

    const allPayloads = context.revalidate.refetch.map(refetchPayload => {
      return {
        key: refetchPayload.key,
        result: refetchPayload.fn({ data: refetchPayload.arg })
      };
    });

    for (const refetchPayload of allPayloads) {
      result.sendContext.payloads.push({
        key: refetchPayload.key,
        result: await refetchPayload.result
      });
    }

    return result;
  });

const prelimRefetchMiddleware = createMiddleware({ type: "function" })
  .inputValidator((config?: RefetchMiddlewareConfig) => config)
  .client(async ({ next, data }) => {
    const { refetch = [] } = data ?? {};

    const router = await getRouterInstance();
    const queryClient: QueryClient = router.options.context.queryClient;
    const cache = queryClient.getQueryCache();

    const revalidate: RevalidationPayload = {
      refetch: []
    };
    const invalidate: any[] = [];

    const allQueriesFound = refetch.flatMap(key => queryClient.getQueriesData({ queryKey: key, exact: false }));

    allQueriesFound.forEach(query => {
      const key = query[0];

      const entry = cache.find({ queryKey: key, exact: true });
      const isActive = !!entry?.observers?.length;
      const revalidatePayload: any = entry?.meta?.__revalidate ?? null;

      if (isActive && revalidatePayload) {
        revalidate.refetch.push({
          key,
          fn: revalidatePayload.serverFn,
          arg: revalidatePayload.arg
        });
      } else {
        invalidate.push(key);
      }
    });

    return await next({
      sendContext: {
        revalidate
      },
      context: {
        invalidate
      }
    });
  })
  .server(async ({ next, context }) => {
    const result = await next({
      sendContext: {
        payloads: [] as any[]
      }
    });

    const allPayloads = context.revalidate.refetch.map(refetchPayload => {
      return {
        key: refetchPayload.key,
        result: refetchPayload.fn({ data: refetchPayload.arg })
      };
    });

    for (const refetchPayload of allPayloads) {
      result.sendContext.payloads.push({
        key: refetchPayload.key,
        result: await refetchPayload.result
      });
    }

    return result;
  });

export const refetchMiddleware = createMiddleware({ type: "function" })
  .middleware([prelimRefetchMiddleware])
  .client(async ({ next }) => {
    const result = await next();

    const router = await getRouterInstance();
    const queryClient: QueryClient = router.options.context.queryClient;

    for (const entry of result.context?.payloads ?? []) {
      queryClient.setQueryData(entry.key, entry.result, { updatedAt: Date.now() });
    }
    for (const entry of result.context?.invalidate ?? []) {
      queryClient.invalidateQueries({ queryKey: entry, exact: true });
    }

    // give our react-query cache a chance to update
    await new Promise(resolve => setTimeout(resolve, 1));

    return result;
  });
