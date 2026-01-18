import { getEpicsSummary } from "@/serverFn/epics";
import { revalidatedQueryOptions } from "./util";
import { queryOptions } from "@tanstack/react-query";

export type EpicOverview = {
  name: string;
  count: number;
};

export const epicsSummaryQueryOptions = () => {
  return queryOptions({
    ...revalidatedQueryOptions(["epics", "list", "summary"], getEpicsSummary),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5
  });
};
