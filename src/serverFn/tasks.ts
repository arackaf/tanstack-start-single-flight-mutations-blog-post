import { createServerFn } from "@tanstack/react-start";
import { db } from "@/drizzle/db";
import { tasks as tasksTable, users as usersTable } from "@/drizzle/schema";
import { asc, count, eq } from "drizzle-orm";

export const getTasksList = createServerFn({ method: "GET" }).handler(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000 * Math.random()));
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, 1));
  return tasks;
});

export const getTask = createServerFn({ method: "GET" })
  .inputValidator((id: string) => Number(id))
  .handler(async ({ data }) => {
    const task = await db.select().from(tasksTable).where(eq(tasksTable.id, data));
    return task[0];
  });

export const getTasksOverview = createServerFn({ method: "GET" }).handler(async () => {
  const results = await db
    .select({ user: usersTable.name, count: count() })
    .from(tasksTable)
    .innerJoin(usersTable, eq(tasksTable.userId, usersTable.id))
    .groupBy(usersTable.id)
    .orderBy(asc(usersTable.name));

  return results;
});

export const updateTask = createServerFn({ method: "POST" })
  .inputValidator((obj: { id: number; name: string }) => obj)
  .handler(async ({ data }) => {
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.random()));
    await db.update(tasksTable).set({ title: data.name }).where(eq(tasksTable.id, data.id));
  });

const noArgs = createServerFn({ method: "POST" }).handler(async () => {});
const args = createServerFn({ method: "POST" })
  .inputValidator((obj: string) => obj)
  .handler(async () => {});

type AnyFn = (...args: any[]) => any;
type ServerFnArgs<TFn extends AnyFn> = Parameters<TFn>[0] extends infer TRootArgs
  ? TRootArgs extends { data: infer TResult }
    ? TResult
    : undefined
  : never;

type ServerFnHasArgs<TFn extends AnyFn> =
  ServerFnArgs<TFn> extends infer U ? (U extends undefined ? false : true) : false;

type ServerFnWithArgs<TFn extends AnyFn> = ServerFnHasArgs<TFn> extends true ? TFn : never;
type ServerFnWithoutArgs<TFn extends AnyFn> = ServerFnHasArgs<TFn> extends false ? TFn : never;

type Test = ServerFnHasArgs<typeof noArgs>;
//    ^?
type Test2 = ServerFnHasArgs<typeof args>;
//    ^?

function foo<TFn extends AnyFn>(_serverFn: ServerFnWithArgs<TFn>, arg: ServerFnArgs<TFn>): number;
function foo<TFn extends AnyFn>(_serverFn: ServerFnWithoutArgs<TFn>): number;
function foo<TFn extends AnyFn>(_serverFn: ServerFnWithoutArgs<TFn> | ServerFnWithArgs<TFn>, _arg?: ServerFnArgs<TFn>) {
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
