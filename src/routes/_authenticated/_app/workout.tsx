import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/_app/workout")({
  head: () => ({ meta: [{ title: "Workout — Fitness AI" }, { name: "description", content: "Workout in Fitness AI." }, { property: "og:title", content: "Workout — Fitness AI" }, { property: "og:description", content: "Workout in Fitness AI." }] }),
  component: () => <ComingSoon icon={Dumbbell} title="Workout" body="Personalized AI workout plans, the exercise library and live workout tracking." />,
});
