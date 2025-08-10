import { sqliteTable, AnySQLiteColumn, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer().primaryKey(),
  name: text()
});

export const epics = sqliteTable("epics", {
  id: integer().primaryKey(),
  name: text()
});

export const tasks = sqliteTable("tasks", {
  id: integer().primaryKey(),
  title: text(),
  epicId: integer(),
  userId: integer()
});

export const milestones = sqliteTable("milestones", {
  id: integer().primaryKey(),
  epicId: integer(),
  name: text()
});
