import { FetcherData, IntersectAllValidatorInputs, RequiredFetcher } from "@tanstack/react-start";
import { QueryKey, queryOptions, AnyUseQueryOptions } from "@tanstack/react-query";
import { Expand } from "@tanstack/react-router";

type OtherQueryOptions = Omit<AnyUseQueryOptions, "queryKey" | "queryFn" | "meta">;

export const revalidatedQueryOptions = <T, U>(
  prefixKey: QueryKey,
  serverFn: RequiredFetcher<any, T, U>,
  args: Expand<IntersectAllValidatorInputs<any, T>>,
  otherQueryOptions: OtherQueryOptions
) => {
  const prefixKeyArr = Array.isArray(prefixKey) ? prefixKey : [prefixKey];

  return queryOptions<FetcherData<U>>({
    ...otherQueryOptions,
    queryKey: [...prefixKeyArr, args],
    queryFn: async () => {
      return serverFn({ data: args });
    },
    meta: {
      __revalidate: {
        serverFn,
        args
      }
    }
  });
};
