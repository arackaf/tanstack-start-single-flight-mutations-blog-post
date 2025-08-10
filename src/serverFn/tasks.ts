import { createServerFn } from "@tanstack/react-start";
import { db } from "@/drizzle/db";
import { tasks as tasksTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const getTasksList = createServerFn({ method: "GET" }).handler(async () => {
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, 1));
  return tasks;
});

export const getTask = createServerFn({ method: "GET" })
  .validator((id: string) => Number(id))
  .handler(async ({ data }) => {
    const task = await db.select().from(tasksTable).where(eq(tasksTable.id, data));
    return task[0];
  });
