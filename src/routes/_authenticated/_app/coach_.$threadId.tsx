import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CoachShell } from "@/features/coach/coach-shell";
import { CoachChat } from "@/features/coach/chat";
import { coachQuery, threadQuery } from "@/features/coach/queries";
import { toMessage } from "@/features/coach/model";
export const Route = createFileRoute("/_authenticated/_app/coach_/$threadId")({
  head: () => ({ meta: [{ title: "Coach conversation — Fitness AI" }, { name: "description", content: "Your private fitness coaching conversation." }, { property: "og:title", content: "Coach conversation — Fitness AI" }, { property: "og:description", content: "Personal fitness guidance with saved conversation history." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: async ({ context, params }) => { await Promise.all([context.queryClient.ensureQueryData(coachQuery), context.queryClient.ensureQueryData(threadQuery(params.threadId))]); },
  component: Thread,
});
function Thread() { const { threadId } = Route.useParams(); const { data } = useSuspenseQuery(threadQuery(threadId)); return <CoachShell threadId={threadId}><CoachChat key={threadId} threadId={threadId} initialMessages={data.messages.map(toMessage)} /></CoachShell>; }