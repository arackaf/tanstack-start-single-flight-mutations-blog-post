import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { updateEpic, updateWithSimpleRefetch } from "@/serverFn/epics";
import { useServerFn } from "@tanstack/react-start";

import { epicsCountQueryOptions, epicsQueryOptions } from "../../../queries/epicsQuery";
import { useDeferredValue, useState, useRef } from "react";
import { Fragment } from "react/jsx-runtime";
import { epicsSummaryQueryOptions } from "@/queries/epicsSummaryQuery";

type SearchParams = {
  page: number;
};

interface Epic {
  id: number;
  name: string;
}

interface EpicItemProps {
  epic: Epic;
}

function EpicItem({ epic }: EpicItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const runSaveFinal = useServerFn(updateEpic);
  const runSaveSimple = useServerFn(updateWithSimpleRefetch);
  const queryClient = useQueryClient();

  const handleSaveSimple = async () => {
    const newValue = inputRef.current?.value || "";
    const result = await runSaveSimple({
      data: {
        id: epic.id,
        name: newValue
      }
    });

    queryClient.setQueryData(epicsQueryOptions(1).queryKey, result.epicsList, { updatedAt: Date.now() });
    queryClient.setQueryData(epicsSummaryQueryOptions().queryKey, result.epicsSummaryData, { updatedAt: Date.now() });

    setIsEditing(false);
  };

  const handleSaveFinal = async () => {
    try {
      const newValue = inputRef.current?.value || "";
      await runSaveFinal({
        data: {
          id: epic.id,
          name: newValue
        }
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (inputRef.current) {
      inputRef.current.value = epic.name;
    }
    setIsEditing(false);
  };

  return (
    <Fragment>
      {isEditing ? (
        <input ref={inputRef} type="text" defaultValue={epic.name} className="border p-1 rounded" autoFocus />
      ) : (
        <div>{epic.name}</div>
      )}
      <Link to="/app/epics/$epicId" params={{ epicId: epic.id + "" }} className="border p-1 rounded">
        View
      </Link>
      {isEditing ? (
        <div className="flex gap-1">
          <button onClick={handleSaveSimple} className="border p-1 rounded bg-green-100">
            Save Simple
          </button>
          <button onClick={handleSaveFinal} className="border p-1 rounded bg-green-100">
            Save Final
          </button>
          <button onClick={handleCancel} className="border p-1 rounded">
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setIsEditing(true)} className="border p-1 rounded">
          Edit
        </button>
      )}
    </Fragment>
  );
}

export const Route = createFileRoute("/app/epics/")({
  validateSearch(search: Record<string, unknown>): SearchParams {
    return {
      page: parseInt(search.page as string, 10) || 1
    };
  },
  loaderDeps: ({ search }) => {
    return { page: search.page };
  },
  async loader({ context, deps }) {
    const queryClient = context.queryClient;

    queryClient.ensureQueryData(epicsQueryOptions(deps.page));
    queryClient.ensureQueryData(epicsCountQueryOptions());
  },
  component: Index,
  pendingComponent: () => <div className="p-3 text-xl">Loading epics ...</div>,
  pendingMinMs: 200,
  pendingMs: 10
});

function Index() {
  const { page } = Route.useSearch();

  const deferredPage = useDeferredValue(page);
  const loading = page !== deferredPage;

  const { data: epicsData } = useSuspenseQuery(epicsQueryOptions(deferredPage));
  const { data: epicsCount } = useSuspenseQuery(epicsCountQueryOptions());

  return (
    <div className="flex flex-col gap-2 p-3">
      <h3 className="text-2xl">Epics page!</h3>
      <h3 className="text-lg">There are {epicsCount.count} epics</h3>
      <div>
        <div
          className={`inline-grid gap-x-8 gap-y-4 grid-cols-[auto_auto_auto] items-center p-3 ${loading ? "opacity-40" : ""}`}
        >
          {epicsData.map((epic, idx) => (
            <EpicItem key={idx} epic={epic} />
          ))}
          <div className="flex gap-3">
            <Link
              to="/app/epics"
              search={{ page: page - 1 }}
              className="border p-1 rounded"
              disabled={loading || page === 1}
            >
              Prev
            </Link>
            <Link
              to="/app/epics"
              search={{ page: page + 1 }}
              className="border p-1 rounded"
              disabled={loading || !epicsData.length}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
