import { getEpicsCount, getEpicsList } from "@/serverFn/epics";
import { revalidatedQueryOptions } from "./util";
import { queryOptions } from "@tanstack/react-query";

export const epicsQueryOptions = (page: number) => {
  return queryOptions({
    ...revalidatedQueryOptions(["epics", "list"], getEpicsList, page),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5
  });
};

export const epicsCountQueryOptions = () => {
  return queryOptions({
    queryKey: ["epics-count"],
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
    queryKey: ["epics-count"],
    queryFn: async () => {
      const result = await getEpicsCount();
      return result;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5
  });
};
