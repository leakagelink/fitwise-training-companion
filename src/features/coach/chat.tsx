import { useEffect, useRef, useState } from "react";
import type { ChatStatus, UIMessage } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { messageText } from "./model";

const eventSchema = z.discriminatedUnion("type", [z.object({ type: z.literal("saved"), id: z.string() }), z.object({ type: z.literal("delta"), text: z.string() }), z.object({ type: z.literal("done"), id: z.string() }), z.object({ type: z.literal("error"), message: z.string() })]);
const suggestions = ["How can I improve my workout consistency?", "What should I eat after a workout?", "How much rest do I need between workouts?"];
export function CoachChat({ threadId, initialMessages }: { threadId: string; initialMessages: UIMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const qc = useQueryClient();
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => { textarea.current?.focus({ preventScroll: true }); return () => abortRef.current?.abort(); }, []);
  async function send(text: string) {
    if (!text.trim() || busy) return;
    const controller = new AbortController(); abortRef.current = controller;
    const userId = crypto.randomUUID(); const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: userId, role: "user", parts: [{ type: "text", text }] }]);
    setDraft(""); setError(""); setStatus("submitted"); textarea.current?.focus({ preventScroll: true });
    let serverSaved = false; let finished = false;
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Please sign in again");
      const response = await fetch("/api/public/coach", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session.access_token}` }, body: JSON.stringify({ threadId, text }), signal: controller.signal });
      if (!response.ok) { const body = await response.json(); throw new Error(z.object({ error: z.string() }).parse(body).error); }
      const reader = response.body?.getReader(); if (!reader) throw new Error("No answer stream received");
      const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const chunk = await reader.read(); buffer += decoder.decode(chunk.value, { stream: !chunk.done });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue; const event = eventSchema.parse(JSON.parse(line));
          if (event.type === "saved") { serverSaved = true; setMessages((prev) => prev.map((m) => m.id === userId ? { ...m, id: event.id } : m)); }
          if (event.type === "delta") {
            setStatus("streaming");
            setMessages((prev) => { const current = prev.find((m) => m.id === assistantId); return current ? prev.map((m) => m.id === assistantId ? { ...m, parts: [{ type: "text", text: messageText(m) + event.text }] } : m) : [...prev, { id: assistantId, role: "assistant", parts: [{ type: "text", text: event.text }] }]; });
          }
          if (event.type === "error") throw new Error(event.message);
          if (event.type === "done") { finished = true; setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, id: event.id } : m)); }
        }
        if (chunk.done) break;
      }
      if (!finished) throw new Error("Answer interrupted. Any partial answer shown is not saved.");
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Could not complete your request");
      else setError("Stopped. A partial answer is not saved.");
      if (!serverSaved) { setMessages((prev) => prev.filter((m) => m.id !== userId)); setDraft(text); }
    } finally {
      setStatus("ready"); abortRef.current = null;
      void qc.invalidateQueries({ queryKey: ["coach"] }); void qc.invalidateQueries({ queryKey: ["coach-thread", threadId] });
      textarea.current?.focus({ preventScroll: true });
    }
  }
  return <div className="flex min-w-0 flex-col">
    <Conversation className="h-[42dvh] min-h-64 flex-none lg:h-[50dvh]"><ConversationContent className="gap-6 px-0">
      {!messages.length && <div className="space-y-5 py-4"><Logo /><h2 className="text-xl font-semibold">What’s on your mind today?</h2><div className="flex flex-col items-start gap-2">{suggestions.map((s) => <Button key={s} variant="outline" className="h-auto max-w-full whitespace-normal py-2 text-left" onClick={() => { setDraft(s); textarea.current?.focus({ preventScroll: true }); }}>{s}</Button>)}</div></div>}
      {messages.map((message) => <Message key={message.id} from={message.role} className="max-w-full"><MessageContent className={message.role === "user" ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground" : "w-full"}>{message.parts.map((part, i) => part.type === "text" ? message.role === "assistant" ? <MessageResponse key={i}>{part.text}</MessageResponse> : <p key={i} className="whitespace-pre-wrap break-words">{part.text}</p> : null)}</MessageContent></Message>)}
      {status === "submitted" && <Shimmer className="text-sm">Coach is thinking…</Shimmer>}
    </ConversationContent><ConversationScrollButton /></Conversation>
    {error && <p role="alert" className="my-2 text-sm text-destructive">{error}</p>}
    <PromptInput onSubmit={() => send(draft)} className="mt-3"><PromptInputTextarea ref={textarea} aria-label="Message AI Coach" placeholder="Ask your fitness coach…" value={draft} maxLength={6000} onChange={(e) => setDraft(e.target.value)} className="min-h-20" /><PromptInputFooter className="justify-end"><PromptInputSubmit aria-label={busy ? "Stop response" : "Send message"} status={status} disabled={!busy && !draft.trim()} onStop={() => abortRef.current?.abort()} /></PromptInputFooter></PromptInput>
    <p className="my-2 text-[11px] text-muted-foreground">AI guidance is not medical advice. Estimates may vary.</p>
  </div>;
}