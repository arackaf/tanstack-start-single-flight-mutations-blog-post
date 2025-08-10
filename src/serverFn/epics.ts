import { createServerFn } from "@tanstack/react-start";
import { db } from "@/drizzle/db";
import { epics as epicsTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const getEpicsList = createServerFn({ method: "GET" })
  .validator((page: number) => page)
  .handler(async ({ data }) => {
    const tasks = await db
      .select()
      .from(epicsTable)
      .offset((data - 1) * 4)
      .limit(4);
    return tasks;
  });

export const getEpic = createServerFn({ method: "GET" })
  .validator((id: string) => Number(id))
  .handler(async ({ data }) => {
    const task = await db.select().from(epicsTable).where(eq(epicsTable.id, data));
    return task[0];
  });
