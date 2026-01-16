import { getEpicsCount, getEpicsList } from "@/serverFn/epics";
import { queryOptions } from "../lib/queryOptions";
import { revalidatedQueryOptions } from "./util";

export const epicsQueryOptions = (page: number) => {
  return queryOptions({
    queryKey: ["epics", "list", page],
    queryFn: async () => {
      const result = await getEpicsList({ data: page });
      return result;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5
  });
};

export const epicsCountQueryOptions = () => {
  return queryOptions({
    queryKey: ["epics", "count"],
    queryFn: async () => {
      const result = await getEpicsCount();
      return result;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5
  });
};

export const backup__epicsCountQueryOptions = () => {
  return queryOptions({
    queryKey: ["epics", "count"],
    queryFn: async () => {
      const result = await getEpicsCount();
      return result;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5
  });
};
