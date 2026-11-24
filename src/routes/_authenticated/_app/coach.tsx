import { createFileRoute } from "@tanstack/react-router";
import { CoachShell } from "@/features/coach/coach-shell";
import { coachQuery } from "@/features/coach/queries";
import { ScreenLoadError, ScreenNotFound } from "@/components/screen-load-state";

export const Route = createFileRoute("/_authenticated/_app/coach")({
  head: () => ({
    meta: [
      { title: "Customize Coach — Muscles Zone" },
      {
        name: "description",
        content: "Personalized fitness, nutrition and recovery conversations.",
      },
      { property: "og:title", content: "Customize Coach — Muscles Zone" },
      {
        property: "og:description",
        content: "Chat about fitness, nutrition and recovery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({ ...coachQuery, revalidateIfStale: true }),
  errorComponent: ScreenLoadError,
  notFoundComponent: ScreenNotFound,
  component: () => <CoachShell />,
});
