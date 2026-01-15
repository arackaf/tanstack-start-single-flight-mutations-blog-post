import { getEpicsOverview } from "@/serverFn/epics";
import { revalidatedQueryOptions } from "./util";

export type EpicOverview = {
  name: string;
  count: number;
};

export const epicsSummaryQueryOptions = () => {
  return revalidatedQueryOptions(["epics", "summary"], getEpicsOverview, [], {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5
  });
};
