import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet, useRouterState } from "@tanstack/react-router";
import { Scripts, Meta } from "@tanstack/react-start";
import { FC } from "react";

import appCss from "../styles/globals.css?url";

const Loading: FC<{ shown: boolean }> = (props) => {
  const { shown } = props;
  const corePosition = "fixed left-[50%] top-0 translate-x-[-50%] bg-yellow-300";
  return (
    <div
      style={{
        opacity: shown ? 1 : 0,
        transition: shown ? "opacity 300ms ease-in 20ms" : "",
      }}
      className={`${corePosition} rounded-b px-2 py-1`}
    >
      Loading ...
    </div>
  );
};

type MyRouterContext = {
  queryClient: QueryClient;
  user: { id: string; name: string } | null;
  timestarted: number;
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  async beforeLoad({ context }) {
    if (context.user) {
      return { user: context.user };
    }

    const result = { id: "1", name: "Adam" };
    return result;
  },
  context({ location }) {
    const timeStarted = +new Date();
    console.log("");
    console.log("Fresh navigation to", location.href);
    console.log("------------------------------------------------------------------------------------");

    return { timestarted: timeStarted };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: Root,
});

function Root() {
  const state = useRouterState();
  const isNavigating = state.isLoading;

  return (
    <html>
      <head>
        <Meta />
      </head>

      <body>
        <div className="p-x-2">
          <Loading shown={isNavigating} />
          <Outlet />
          <Scripts />
        </div>
      </body>
    </html>
  );
}
