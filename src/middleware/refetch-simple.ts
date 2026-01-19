import { createMiddleware } from "@tanstack/react-start";
import { getEpicsList } from "@/serverFn/epics";

export const epicsListRefetchMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {


    const result = await next();

    console.log("epicsListRefetchMiddleware client", { result });

    return result;
  })
  .server(async ({ next }) => {
    const result = await next({
      sendContext: {
        payload: {} as any
      }
    });

    result.sendContext.payload.a = 12;

    await getEpicsList({ data: 1 });

    return result;
  });
