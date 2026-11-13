import { createFileRoute } from "@tanstack/react-router";
import { CoachShell } from "@/features/coach/coach-shell";
import { coachQuery } from "@/features/coach/queries";

export const Route = createFileRoute("/_authenticated/_app/coach")({
  head: () => ({
    meta: [
      { title: "AI Coach — Fitness AI" },
      {
        name: "description",
        content: "Personalized fitness conversations and human coach requests.",
      },
      { property: "og:title", content: "AI Coach — Fitness AI" },
      {
        property: "og:description",
        content: "Chat about fitness, nutrition and recovery, or request a human coach.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(coachQuery),
  component: () => <CoachShell />,
});
