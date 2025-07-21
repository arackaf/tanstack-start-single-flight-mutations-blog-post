import { createFileRoute } from "@tanstack/react-router";
import { createMiddleware, createServerFn } from "@tanstack/react-start";

//--------------------------------

const queryMutationRequestMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    return await next({
      sendContext: {
        queriesToRevalidate: { queryA: true, queryB: true },
      },
    });
  })
  .server(async ({ next, context }) => {
    // read which queries to revalidate, that were sent from the client
    console.log("Queries to revalidate 2", context.queriesToRevalidate);

    const updatedQueries: Record<string, any> = {};

    const value = await next({
      sendContext: {
        updatedQueries,
      },
    });

    // FETCH NEW QUERY DATA
    value.sendContext.updatedQueries.queryA = { data: "hello 1" };
    value.sendContext.updatedQueries.queryB = { data: "hello 2" };

    return value;
  });

const queryMutationResponseMiddleware = createMiddleware({ type: "function" })
  .middleware([queryMutationRequestMiddleware])
  .client(async ({ next }) => {
    const result = await next();

    const updatedQueries = result.context.updatedQueries;

    console.log({ updatedQueries });

    return result;
  });

export const callServerFn2 = createServerFn()
  .middleware([queryMutationResponseMiddleware])
  .handler(async () => {
    return { value: new Date().toISOString() };
  });

//--------------------------------

const queryMutationMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const result = await next({
      // this part is weird - it works without this, but the typings break. The server sets this,
      // and again I can remove this line and it still works, but the types break. Am I missing something?
      context: { updatedQueries: {} as Record<string, boolean> },
      sendContext: {
        // actual message we send to the server, telling it which queries to revalidate
        queriesToRevalidate: { queryA: true, queryB: true } as Record<string, any>,
      },
    });

    const updatedQueries = result.context.updatedQueries;
    console.log({ updatedQueries });

    return result;
  })
  .server(async ({ next, context }) => {
    // read which queries to revalidate, that were sent from the client
    console.log("Queries to revalidate", context.queriesToRevalidate);

    const value = await next({
      sendContext: {
        // seed this with an empty object, so the typings know about it
        updatedQueries: {} as Record<string, any>,
      },
    });
    // FETCH NEW QUERY DATA
    value.sendContext.updatedQueries.queryA = { data: "hello 1" };
    value.sendContext.updatedQueries.queryB = { data: "hello 2" };

    return value;
  });

export const callServerFn = createServerFn()
  .middleware([queryMutationMiddleware])
  .handler(async () => {
    return { value: new Date().toISOString() };
  });

export const Route = createFileRoute("/")({
  component: App,
});

const serverTimer = createMiddleware({ type: "function" }).server(async ({ next }) => {
  console.log({ next });

  return next({
    sendContext: {
      xxx: 12,
    },
  });
});

const reactQueryClientMiddlewareClient = createMiddleware({ type: "function" })
  .middleware([serverTimer])
  .client(async ({ next }) => {
    const result = await next();
    console.log({ next });

    result.context.xxx;

    return result;
  });

function App() {
  function runServerFn() {
    callServerFn2().then((result) => {
      console.log({ result });
    });
  }

  return (
    <div className="text-center">
      <div className="m-6 p-6">
        <button onClick={runServerFn} className="bg-blue-500 text-white p-2 rounded-md">
          Go
        </button>
      </div>
    </div>
  );
}
