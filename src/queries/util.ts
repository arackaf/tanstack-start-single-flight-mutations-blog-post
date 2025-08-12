import { IntersectAllValidatorInputs, RequiredFetcher } from "@tanstack/react-start";
import { QueryKey, QueryOptions, queryOptions } from "@tanstack/react-query";
import { Expand } from "@tanstack/react-router";

type OtherQueryOptions = Omit<QueryOptions, "queryKey" | "queryFn" | "meta">;

export const revalidatedQueryOptions = <T>(
  prefixKey: QueryKey,
  serverFn: RequiredFetcher<any, T, any, any>,
  args: Expand<IntersectAllValidatorInputs<any, T>>,
  otherQueryOptions: OtherQueryOptions
) => {
  const prefixKeyArr = Array.isArray(prefixKey) ? prefixKey : [prefixKey];

  return queryOptions({
    ...otherQueryOptions,
    queryKey: [...prefixKeyArr, args],
    queryFn: async () => {
      return await serverFn({ data: args });
    },
    meta: {
      serverFn,
      args
    }
  });
};
