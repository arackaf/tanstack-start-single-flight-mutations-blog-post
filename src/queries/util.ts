import { IntersectAllValidatorInputs, RequiredFetcher } from "@tanstack/react-start";
import { QueryKey, queryOptions, AnyUseQueryOptions } from "@tanstack/react-query";
import { Expand } from "@tanstack/react-router";

type OtherQueryOptions = Omit<AnyUseQueryOptions, "queryKey" | "queryFn" | "meta">;

export function revalidatedQueryOptions<T, U>(
  prefixKey: QueryKey,
  serverFn: RequiredFetcher<any, T, Promise<U>>,
  args: T extends undefined ? [] : [Expand<IntersectAllValidatorInputs<any, T>>],
  otherQueryOptions?: OtherQueryOptions
) {
  const prefixKeyArr = Array.isArray(prefixKey) ? prefixKey : [prefixKey];

  return queryOptions<U>({
    ...otherQueryOptions,
    queryKey: [...prefixKeyArr, ...args],
    queryFn: async (): Promise<U> => {
      // return serverFn({ data: args });
      if (args.length === 0) {
        return serverFn({ data: undefined as any });
      }
      return serverFn({ data: args[0] });
    },
    meta: {
      __revalidate: {
        serverFn,
        args
      }
    }
  });
}
