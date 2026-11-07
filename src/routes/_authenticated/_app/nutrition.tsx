import { createFileRoute } from "@tanstack/react-router";
import { Apple } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/_app/nutrition")({
  head: () => ({ meta: [{ title: "Nutrition — Fitness AI" }, { name: "description", content: "Nutrition in Fitness AI." }, { property: "og:title", content: "Nutrition — Fitness AI" }, { property: "og:description", content: "Nutrition in Fitness AI." }] }),
  component: () => <ComingSoon icon={Apple} title="Nutrition" body="AI diet plans, recipes, grocery lists and meal logging." />,
});
