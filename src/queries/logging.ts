import { db } from "@/drizzle/db";
import { actionLog } from "@/drizzle/schema";

export async function addLog(actionName: string, clientStart: string, traceId: string, duration: number) {
  await db.insert(actionLog).values({
    id: crypto.randomUUID(),
    traceId,
    clientStart,
    clientEnd: "",
    actionName,
    actionDuration: duration
  });
}
