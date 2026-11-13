import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { MessageSquare, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { createThread, deleteThread } from "./coach.functions";
import { coachQuery } from "./queries";
import { HumanCoach } from "./human-coach";

export function CoachShell({
  threadId,
  children,
}: {
  threadId?: string;
  children?: React.ReactNode;
}) {
  const { data } = useSuspenseQuery(coachQuery);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createThread);
  const remove = useServerFn(deleteThread);
  const [busy, setBusy] = useState(false);
  async function newChat() {
    setBusy(true);
    try {
      const row = await create();
      await qc.invalidateQueries({ queryKey: ["coach"] });
      await navigate({ to: "/coach/$threadId", params: { threadId: row.id } });
    } catch {
      toast.error("Could not create conversation");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-5xl px-5 pt-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI Coach</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Your fitness & recovery conversations
          </p>
        </div>
        <Button
          size="icon"
          title="New conversation"
          aria-label="New conversation"
          onClick={newChat}
          disabled={busy}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Plus />}
        </Button>
      </header>
      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[200px_1fr]">
        <aside className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Conversations
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:max-h-[65dvh] lg:flex-col lg:overflow-y-auto">
            {data.threads.map((t) => (
              <div
                key={t.id}
                className="flex shrink-0 items-center gap-1 rounded-md bg-secondary lg:shrink"
              >
                <Link
                  to="/coach/$threadId"
                  params={{ threadId: t.id }}
                  className="flex max-w-48 min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm"
                  activeProps={{ className: "text-primary" }}
                >
                  <MessageSquare className="size-4 shrink-0" />
                  <span className="truncate">{t.title}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Delete conversation"
                  aria-label={`Delete ${t.title}`}
                  disabled={busy}
                  onClick={async () => {
                    if (!window.confirm("Delete this conversation and its messages?")) return;
                    setBusy(true);
                    try {
                      await remove({ data: { id: t.id } });
                      await qc.invalidateQueries({ queryKey: ["coach"] });
                      if (t.id === threadId) await navigate({ to: "/coach" });
                    } catch {
                      toast.error("Could not delete conversation");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
            {!data.threads.length && (
              <p className="text-xs text-muted-foreground">No conversations yet</p>
            )}
          </div>
        </aside>
        <div className="min-w-0">
          {children ?? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-5 text-center">
              <Logo />
              <h2 className="text-xl font-semibold">Let’s talk about your goal</h2>
              <Button onClick={newChat} disabled={busy}>
                <Plus />
                New conversation
              </Button>
            </div>
          )}
          <HumanCoach />
        </div>
      </div>
    </div>
  );
}
