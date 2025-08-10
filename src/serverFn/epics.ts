import { createServerFn } from "@tanstack/react-start";
import { db } from "@/drizzle/db";
import { epics as epicsTable, tasks as tasksTable } from "@/drizzle/schema";
import { asc, count, eq, sql } from "drizzle-orm";

export const getEpicsList = createServerFn({ method: "GET" })
  .validator((page: number) => page)
  .handler(async ({ data }) => {
    const epics = await db
      .select()
      .from(epicsTable)
      .offset((data - 1) * 4)
      .limit(4);
    return epics;
  });

export const getEpic = createServerFn({ method: "GET" })
  .validator((id: string | number) => Number(id))
  .handler(async ({ data }) => {
    const epic = await db.select().from(epicsTable).where(eq(epicsTable.id, data));
    return epic[0];
  });

export const getEpicsCount = createServerFn({ method: "GET" }).handler(async ({}) => {
  const count = await db.$count(epicsTable);
  return { count };
});

export const getEpicsOverview = createServerFn({ method: "GET" }).handler(async ({}) => {
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
    .orderBy(asc(subQuery.count));

  const results = await query;
  return results;
});
