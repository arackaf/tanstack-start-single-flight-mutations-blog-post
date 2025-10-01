import { queryOptions } from "@tanstack/react-query";
import { getEpic } from "@/serverFn/epics";
import { revalidatedQueryOptions } from "./util";

export const epicQueryOptions = (id: string | number) => {
  id = Number(id);

  return revalidatedQueryOptions(["epic", id], getEpic, id, {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5
  });
};
