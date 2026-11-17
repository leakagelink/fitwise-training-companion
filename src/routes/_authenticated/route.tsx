import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authenticatedUserQuery } from "@/features/account/auth-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.fetchQuery(authenticatedUserQuery);
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: () => <Outlet />,
});
