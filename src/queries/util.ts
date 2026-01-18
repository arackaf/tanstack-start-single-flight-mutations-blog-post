import { IntersectAllValidatorInputs, RequiredFetcher } from "@tanstack/react-start";
import { QueryKey, queryOptions, AnyUseQueryOptions } from "@tanstack/react-query";
import { Expand } from "@tanstack/react-router";

type OtherQueryOptions = Omit<AnyUseQueryOptions, "queryKey" | "queryFn" | "meta">;

type ServerFnArgs<TServerFn extends RequiredFetcher<any, any, any>> =
  TServerFn extends RequiredFetcher<any, infer TArgs, any>
    ? TArgs extends undefined
      ? []
      : [Expand<IntersectAllValidatorInputs<any, TArgs>>]
    : never;

export function revalidatedQueryOptionsFinal<T, U>(
  prefixKey: QueryKey,
  serverFn: RequiredFetcher<any, T, Promise<U>>,
  arg: ServerFnArgs<RequiredFetcher<any, T, Promise<U>>>,
  otherQueryOptions?: OtherQueryOptions
) {
  const prefixKeyArr = Array.isArray(prefixKey) ? prefixKey : [prefixKey];

  return queryOptions<U>({
    ...otherQueryOptions,
    queryKey: [...prefixKeyArr, ...arg],
    queryFn: async (): Promise<U> => {
      if (arg.length === 0) {
        return serverFn({ data: undefined as any });
      }
      return serverFn({ data: arg[0] });
    },
    meta: {
      __revalidate: {
        serverFn,
        arg
      }
    }
  });
}

export function revalidatedQueryOptions(queryKey: QueryKey, serverFn: any, arg?: any) {
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
