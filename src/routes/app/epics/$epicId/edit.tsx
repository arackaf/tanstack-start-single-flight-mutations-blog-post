import { createMiddleware, useServerFn } from "@tanstack/start";
import { Query, useQueryClient, useSuspenseQuery, type QueryKey } from "@tanstack/react-query";

import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { epicLoader } from "../../../../queries/epicQuery";
import { useEffect, useRef, useState } from "react";
import { postToApi } from "../../../../../backend/fetchUtils";
import { createServerFn } from "@tanstack/start";
import { queryClient } from "../../../../queryClient";
import { loaderLookup } from "../../../../lib/loaderLookup";

type ActiveQueryPacket = {
  key: QueryKey;
  entry: Query<unknown, Error, { a: 12 }>;
};

type QueryMetadataPacket = { queryId: string; args: any[] };

function getActiveQueries(key: QueryKey): ActiveQueryPacket[] {
  const queries = queryClient.getQueriesData({ queryKey: key });
  const cache = queryClient.getQueryCache();

  return queries
    .map(([q]) => {
      const entry = cache.find({ queryKey: q, exact: true });
      return !!entry?.observers.length ? { key: q, entry } : null;
    })
    .filter(packet => packet) as ActiveQueryPacket[];
}

const reactQueryMiddleware = createMiddleware()
  .client(async ({ next }) => {
    console.log("Client before");

    const epicQueries = getActiveQueries(["epic"]);
    const epicsQueries = getActiveQueries(["epics"]);

    const queryInfoContext = epicQueries.reduce((ctx, { key, entry }) => {
      const middlewarePacket = entry.meta?.__middlewareQueryInfo as QueryMetadataPacket | null;

      if (middlewarePacket) {
        const { queryId, args } = middlewarePacket;
        ctx.push({ queryId, args, reactQueryKey: key });
      }

      return ctx;
    }, [] as any[]);

    try {
      console.log("Calling next()");

      const res = await next({ sendContext: { abc: 89, queryRevalidation: queryInfoContext } });
      console.log("in client", "result", { res });

      const queryUpdatesPayload = res.context.queryUpdatesPayload;
      queryUpdatesPayload.forEach(packet => {
        // debugger;
        queryClient.invalidateQueries({ queryKey: ["epic"] });
        // queryClient.invalidateQueries({ queryKey: ["epic"], refetchType: "none" });
        // queryClient.removeQueries({ queryKey: ["epic"] });
        queryClient.setQueryData(packet.reactQueryKey, packet.data, { updatedAt: +new Date() });
      });

      return res;
    } catch (er) {
      console.log({ er });
      throw er;
    }
  })
  .server(async ({ next, context }) => {
    console.log("Middleware server before", { context, queryRevalidation: context.queryRevalidation });
    // Object.entries(loaderLookup).forEach(([key, value]) => {
    //   console.log(key, value.toString());
    // });

    try {
      var serverFnResult = await next({
        sendContext: { xyz: 999, query: {} as Record<string, any> },
      });

      const queryRevalidation = context.queryRevalidation;
      const { queryId, args, reactQueryKey } = queryRevalidation[0];

      const queryFn = loaderLookup[queryId];
      console.log({ queryFn });

      const data = await queryFn(...args);

      //const epicsListOptions = epicsQueryOptions(0, 1);

      // @ts-ignore
      //const listData = await epicsListOptions.queryFn();
      const queryUpdatesPayload = [] as any[];
      queryUpdatesPayload.push({
        reactQueryKey,
        data,
      });

      serverFnResult.sendContext.queryUpdatesPayload = queryUpdatesPayload;
    } catch (er) {
      console.log("Server middleware error", er);
      throw er;
    }

    return serverFnResult;
  });

export const saveEpic = createServerFn({ method: "POST" })
  .middleware([reactQueryMiddleware])
  .validator((updates: { id: string; newName: string }) => updates)
  .handler(async ({ data, context }) => {
    console.log("\nRunning server function");

    await postToApi("api/epic/update", {
      id: data.id,
      name: data.newName,
    });

    //throw redirect({ to: "/app/epics", search: { page: 1 } });
  });

export const Route = createFileRoute("/app/epics/$epicId/edit")({
  component: EditEpic,
  context({ context, params }) {
    return {
      currentEpicOptions: epicLoader.queryOptions(params.epicId),
    };
  },
  loader({ context }) {
    context.queryClient.prefetchQuery(context.currentEpicOptions);
  },
});

function EditEpic() {
  const { currentEpicOptions } = Route.useRouteContext();
  const { epicId } = Route.useParams();

  const { data: epic } = useSuspenseQuery(currentEpicOptions);
  const newName = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();

  const runSave = useServerFn(saveEpic);

  const save = async () => {
    console.log("HELLO");
    setSaving(true);

    const result: any = await runSave({
      data: {
        id: epic.id,
        newName: newName.current!.value,
      },
    });

    console.log({ result });

    //const listOptions = epicsQueryOptions(0, 1);

    //queryClient.invalidateQueries({ queryKey: ["epics"], refetchType: "none" });
    // queryClient.invalidateQueries({ queryKey: ["epic"], refetchType: "none" });
    // queryClient.removeQueries({ queryKey: ["epic"], refetchType: "none" });

    //queryClient.setQueryData(["epics", "list", 1], result.query.listData, { updatedAt: Date.now() });
    //queryClient.setQueryData(["epic", "1"], result.query.epicData, { updatedAt: Date.now() });

    //queryClient.refetchQueries({ queryKey: ["epics"], type: "active", stale: true });
    //queryClient.refetchQueries({ queryKey: ["epic"], type: "active", stale: true });

    setSaving(false);
  };

  useEffect(() => {
    newName.current!.value = epic.name;
  }, [epic.name]);

  return (
    <div className="flex flex-col gap-5 p-3">
      <div>
        <Link to="/app/epics" search={{ page: 1 }}>
          Back
        </Link>
      </div>
      <div>
        <div className="flex flex-col gap-2">
          <span>Edit epic {epic.id}</span>
          <span>{epic.name}</span>
          <input className="self-start border p-2 w-64" ref={newName} defaultValue={epic.name} />
          <div className="flex gap-2"></div>
          <button className="self-start p-2 border" onClick={save}>
            Save
          </button>
          {saving && <span>Saving...</span>}
        </div>
      </div>
    </div>
  );
}
