import { HeadContent, Scripts, createRootRouteWithContext, Outlet } from "@tanstack/react-router";

import type { QueryClient } from "@tanstack/react-query";

import appCss from "../styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  notFoundComponent: () => {
    return <div>Not found</div>;
  },
  component: () => {
    return <Outlet />;
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "TanStack Start Starter"
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),

  shellComponent: RootDocument
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {/* <TanStackRouterDevtools /> */}
        {/* <TanStackQueryLayout /> */}
        <Scripts />
      </body>
    </html>
  );
}
