import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/_app/coach")({
  head: () => ({ meta: [{ title: "AI Coach — Fitness AI" }, { name: "description", content: "AI Coach in Fitness AI." }, { property: "og:title", content: "AI Coach — Fitness AI" }, { property: "og:description", content: "AI Coach in Fitness AI." }] }),
  component: () => <ComingSoon icon={Bot} title="AI Coach" body="Streaming AI coach chat with history, plus Human Coach booking." />,
});
