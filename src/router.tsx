import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { createAppQueryClient } from "./lib/query-cache";
import { SplashScreen } from "./components/brand/splash-screen";

export const getRouter = () => {
  const queryClient = createAppQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPreload: "intent",
    defaultPendingComponent: SplashScreen,
    defaultPendingMinMs: 150,
  });

  return router;
};
