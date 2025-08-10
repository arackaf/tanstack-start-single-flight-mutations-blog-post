import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { epicQueryOptions } from "../../../../queries/epicQuery";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/app/epics/$epicId/")({
  component: EpicIndex,
  context: ({ params }) => {},
  loader: ({ context, params }) => {
    const { queryClient, timestarted } = context;

    //queryClient.ensureQueryData(epicQueryOptions(timestarted, params.epicId));
  },
  gcTime: 1000 * 60 * 5,
  staleTime: 1000 * 60 * 5,
  pendingComponent: () => <div className="m-4 p-4 text-xl">Loading epic ...</div>,
});

function EpicIndex() {
  const { epicId } = Route.useParams();
  const { timestarted } = Route.useRouteContext();

  const retries = useRef(0);

  const { data: epic, isLoading, isFetching, isRefetching, refetch } = useQuery(epicQueryOptions(timestarted, epicId));

  useEffect(() => {
    if (!epic || retries.current >= 3) {
      console.log("bailing", epic, retries.current);
      return;
    }

    retries.current++;

    console.log("RUN");
    refetch();
  }, [epic]);

  console.log({ isLoading, isFetching, isRefetching });
  return epic ? (
    <div className="flex flex-col gap-3 p-3">
      <Link to="/app/epics" search={{ page: 1 }}>
        Back to epics list
      </Link>
      <h2 className="text-xl">
        {epic.name} {(epic as any).time}
      </h2>
      <Link to="/app/epics/$epicId/milestones" params={{ epicId }} search={{ search: "" }}>
        View milestones
      </Link>
    </div>
  ) : null;
}
