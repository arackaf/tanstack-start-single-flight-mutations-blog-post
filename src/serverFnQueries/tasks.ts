import { createServerFn } from "@tanstack/react-start";
import { Task } from "../../types";

export const getTasksList = createServerFn({ method: "GET" }).handler(async () => {
  return fetch(`http://localhost:3000/api/tasks`, { method: "GET", headers: { Cookie: "user=" + 1 } })
    .then((resp) => resp.json())
    .then((res) => res as Task[]);
});

export const getTask = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    return fetch(`http://localhost:3000/api/tasks/${data}`, { method: "GET" })
      .then((resp) => resp.json())
      .then((res) => res as Task);
  });
