import { getEpic } from "@/serverFn/epics";
import { refetchedQueryOptions } from "./util";
import { queryOptions } from "@tanstack/react-query";

export const epicQueryOptions = (id: string | number) => {
  id = Number(id);

  return queryOptions({
    ...refetchedQueryOptions(["epic"], getEpic, id),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5
  });
};
