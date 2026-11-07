import { createFileRoute } from "@tanstack/react-router";
import { LineChart } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/_app/progress")({
  head: () => ({ meta: [{ title: "Progress — Fitness AI" }, { name: "description", content: "Progress in Fitness AI." }, { property: "og:title", content: "Progress — Fitness AI" }, { property: "og:description", content: "Progress in Fitness AI." }] }),
  component: () => <ComingSoon icon={LineChart} title="Progress" body="Measurements, progress photos, weekly reports and AI progress scores." />,
});
