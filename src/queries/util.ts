import { IntersectAllValidatorInputs, RequiredFetcher } from "@tanstack/react-start";
import { QueryKey, queryOptions, AnyUseQueryOptions, UnusedSkipTokenOptions } from "@tanstack/react-query";
import { Expand } from "@tanstack/react-router";

type OtherQueryOptions = Omit<AnyUseQueryOptions, "queryKey" | "queryFn" | "meta">;

type ServerFnArgs<TFn extends RequiredFetcher<any, any, any>> = Parameters<TFn>[0] extends infer TRootArgs
  ? TRootArgs extends { data: infer TResult }
    ? TResult
    : undefined
  : never;

type ServerFnHasArgs<TFn extends RequiredFetcher<any, any, any>> =
  ServerFnArgs<TFn> extends infer U ? (U extends undefined ? true : false) : false;

// type ServerFnArgs<TServerFn extends RequiredFetcher<any, any, any>> =
//   TServerFn extends RequiredFetcher<any, infer TArgs, any>
//     ? TArgs extends undefined
//       ? []
//       : [Expand<IntersectAllValidatorInputs<any, TArgs>>]
//     : never;

export function revalidatedQueryOptions<T, U>(
  prefixKey: QueryKey,
  serverFn: RequiredFetcher<any, T, Promise<U>>,
  arg: ServerFnArgs<RequiredFetcher<any, T, Promise<U>>>,
  otherQueryOptions?: OtherQueryOptions
): UnusedSkipTokenOptions<U> {
  const prefixKeyArr = Array.isArray(prefixKey) ? prefixKey : [prefixKey];

  return queryOptions<U>({
    ...otherQueryOptions,
    queryKey: [...prefixKeyArr, arg],
    queryFn: async (): Promise<U> => {
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
