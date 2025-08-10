import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  async beforeLoad({ context }) {
    if (context.user) {
      throw redirect({ to: "/app" });
    }
  },
  component: Index,
});

function Index() {
  return (
    <div className="m-3">
      <h2 className="text-2xl">Public Homepage</h2>
    </div>
  );
}
