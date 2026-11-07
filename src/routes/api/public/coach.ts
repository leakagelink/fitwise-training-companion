import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/coach")({ server: { handlers: { POST: async ({ request }) => {
  const { handleCoachChat } = await import("@/lib/ai/coach-chat.server");
  return handleCoachChat(request);
} } } });