import { redirect } from "@tanstack/react-router";
import { createServerFn, RequiredFetcher } from "@tanstack/react-start";
import { db } from "@/drizzle/db";
import { epics as epicsTable, tasks as tasksTable, milestones as milestonesTable } from "@/drizzle/schema";
import { asc, count, desc, eq } from "drizzle-orm";
import { refetchMiddleware } from "@/middleware/refetch";
import { epicsListRefetchMiddleware } from "@/middleware/refetch-simple";

export const getEpicsList = createServerFn({ method: "GET" })
  .inputValidator((page: number) => page)
  .handler(async ({ data }) => {
    // await new Promise(resolve => setTimeout(resolve, 1000));
    const epics = await db
      .select()
      .from(epicsTable)
      .orderBy(asc(epicsTable.name))
      .offset((data - 1) * 4)
      .limit(4);
    return epics;
  });

export const getEpic = createServerFn({ method: "GET" })
  .inputValidator((id: string | number) => Number(id))
  .handler(async ({ data }) => {
    const epic = await db.select().from(epicsTable).where(eq(epicsTable.id, data));
    return epic[0];
  });

export const getEpicsCount = createServerFn({ method: "GET" }).handler(async ({}) => {
  const count = await db.$count(epicsTable);
  return { count };
});

export const getEpicsSummary = createServerFn({ method: "GET" }).handler(async ({}) => {
  const subQuery = db
    .select({ epicId: epicsTable.id, count: count().as("count") })
    .from(epicsTable)
    .innerJoin(tasksTable, eq(epicsTable.id, tasksTable.epicId))
    .groupBy(epicsTable.id)
    .as("epic_counts");

  const query = db
    .with(subQuery)
    .select({ id: epicsTable.id, name: epicsTable.name, count: subQuery.count })
    .from(epicsTable)
    .innerJoin(subQuery, eq(epicsTable.id, subQuery.epicId))
    .orderBy(desc(subQuery.count));

  const results = await query;
  return results;
});

export const getEpicMilestones = createServerFn({ method: "GET" })
  .inputValidator((id: string | number) => Number(id))
  .handler(async ({ data }) => {
    const milestones = await db
      .select()
      .from(milestonesTable)
      .where(eq(milestonesTable.epicId, data))
      .orderBy(milestonesTable.id);
    return milestones;
  });

export const updateWithSimpleRefetch = createServerFn({ method: "POST" })
  .inputValidator((obj: { id: number; name: string }) => obj)
  .handler(async ({ data }) => {
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.random()));
    await db.update(epicsTable).set({ name: data.name }).where(eq(epicsTable.id, data.id));

    const [epicsList, epicsSummaryData] = await Promise.all([getEpicsList({ data: 1 }), getEpicsSummary()]);

    return { epicsList, epicsSummaryData };
  });

export const updateEpic = createServerFn({ method: "POST" })
  .middleware([
    refetchMiddleware({
      refetch: [["epics"], ["epic"]]
    })
  ])
  .inputValidator((obj: { id: number; name: string }) => obj)
  .handler(async ({ data }) => {
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.random()));
    await db.update(epicsTable).set({ name: data.name }).where(eq(epicsTable.id, data.id));
  });

export const updateEpicWithRedirect = createServerFn({ method: "POST" })
  .middleware([epicsListRefetchMiddleware])
  .inputValidator((obj: { id: number; name: string }) => obj)
  .handler(async ({ data }) => {
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.random()));
    await db.update(epicsTable).set({ name: data.name }).where(eq(epicsTable.id, data.id));

    throw redirect({ to: "/app/epics", search: { page: 1 } });
  });

export const updateEpicWithRedirect2 = createServerFn({ method: "POST" })
  .inputValidator((obj: { id: number; name: string }) => obj)
  .handler(async ({ data }) => {
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.random()));
    await db.update(epicsTable).set({ name: data.name }).where(eq(epicsTable.id, data.id));

    throw redirect({ to: "/app/epics", search: { page: 1 } });
  });

const noArgs = createServerFn({ method: "POST" }).handler(async () => {});
const args = createServerFn({ method: "POST" })
  .inputValidator((obj: string) => obj)
  .handler(async () => {});

type ServerFnArgs<TFn extends RequiredFetcher<any, any, any>> = Parameters<TFn>[0] extends infer TRootArgs
  ? TRootArgs extends { data: infer TResult }
    ? TResult
    : undefined
  : never;

type ServerFnHasArgs<TFn extends RequiredFetcher<any, any, any>> =
  ServerFnArgs<TFn> extends infer U ? (U extends undefined ? false : true) : false;

type ServerFnWithArgs<TFn extends RequiredFetcher<any, any, any>> = ServerFnHasArgs<TFn> extends true ? TFn : never;
type ServerFnWithoutArgs<TFn extends RequiredFetcher<any, any, any>> = ServerFnHasArgs<TFn> extends false ? TFn : never;

type Test = ServerFnHasArgs<typeof noArgs>;
//    ^?
type Test2 = ServerFnHasArgs<typeof args>;
//    ^?

function foo<TFn extends RequiredFetcher<any, any, any>>(
  _serverFn: ServerFnWithArgs<TFn>,
  arg: ServerFnArgs<TFn>
): number;
function foo<TFn extends RequiredFetcher<any, any, any>>(_serverFn: ServerFnWithoutArgs<TFn>): number;
function foo<TFn extends RequiredFetcher<any, any, any>>(
  _serverFn: ServerFnWithoutArgs<TFn> | ServerFnWithArgs<TFn>,
  _arg?: ServerFnArgs<TFn>
) {
  return 0;
}

foo(noArgs);

// @ts-expect-error
foo(noArgs, "hello");

// @ts-expect-error
foo(args);

foo(args, "hello");

// @ts-expect-error
foo(args, 12);
