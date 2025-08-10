import { createServerFn } from "@tanstack/react-start";
import { db } from "@/drizzle/db";
import { epics as epicsTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

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
