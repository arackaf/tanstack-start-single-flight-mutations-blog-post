import { QueryKey, queryOptions } from "@tanstack/react-query";

type AnyAsyncFn = (...args: any[]) => Promise<any>;

type ServerFnArgs<TFn extends AnyAsyncFn> = Parameters<TFn>[0] extends infer TRootArgs
  ? TRootArgs extends { data: infer TResult }
    ? TResult
    : undefined
  : never;

type ServerFnHasArgs<TFn extends AnyAsyncFn> =
  ServerFnArgs<TFn> extends infer U ? (U extends undefined ? false : true) : false;

type ServerFnWithArgs<TFn extends AnyAsyncFn> = ServerFnHasArgs<TFn> extends true ? TFn : never;
type ServerFnWithoutArgs<TFn extends AnyAsyncFn> = ServerFnHasArgs<TFn> extends false ? TFn : never;

type RefetchQueryOptions<T> = {
  queryKey: QueryKey;
  queryFn?: (_: any) => Promise<T>;
  meta?: any;
};

type ValidateServerFunction<Provided, Expected> = Provided extends Expected
  ? Provided
  : "This server function requires an argument!";

export function refetchedQueryOptions<TFn extends AnyAsyncFn>(
  queryKey: QueryKey,
  serverFn: ServerFnWithArgs<TFn>,
  arg: Parameters<TFn>[0]["data"]
): RefetchQueryOptions<Awaited<ReturnType<TFn>>>;
export function refetchedQueryOptions<TFn extends AnyAsyncFn>(
  queryKey: QueryKey,
  serverFn: ValidateServerFunction<TFn, ServerFnWithoutArgs<TFn>>
): RefetchQueryOptions<Awaited<ReturnType<TFn>>>;
export function refetchedQueryOptions<TFn extends (arg: { data: any }) => Promise<any>>(
  queryKey: QueryKey,
  serverFn: ServerFnWithoutArgs<TFn> | ServerFnWithArgs<TFn>,
  arg?: Parameters<TFn>[0]["data"]
): RefetchQueryOptions<Awaited<ReturnType<TFn>>> {
  const queryKeyToUse = [...queryKey];
  if (arg != null) {
    queryKeyToUse.push(arg);
  }
  return queryOptions({
    queryKey: queryKeyToUse,
    queryFn: async () => {
      return serverFn({ data: arg });
    },
    meta: {
      __revalidate: {
        serverFn,
        arg
      }
    }
  });
}
