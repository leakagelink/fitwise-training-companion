import { z } from "zod";
export const capabilities = ["support", "billing", "coaching", "privacy", "reports"] as const;
export type Capability = typeof capabilities[number];
export const operationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("permission"), userId: z.string().uuid(), capability: z.enum(capabilities), enabled: z.boolean() }),
  z.object({ action: z.literal("reply"), ticketId: z.string().uuid(), body: z.string().trim().min(1).max(4000), status: z.enum(["open", "in_progress", "resolved"]) }),
  z.object({ action: z.literal("note"), userId: z.string().uuid(), body: z.string().trim().min(1).max(4000) }),
  z.object({ action: z.literal("delete_note"), id: z.string().uuid() }),
  z.object({ action: z.literal("broadcast"), userIds: z.array(z.string().uuid()).min(1).max(100), title: z.string().trim().min(1).max(120), body: z.string().trim().min(1).max(2000) }),
  z.object({ action: z.literal("privacy_status"), id: z.string().uuid(), status: z.enum(["pending", "in_review", "completed", "declined"]), reason: z.string().trim().min(3).max(500) }),
]);
export function requiredCapability(action: z.infer<typeof operationSchema>["action"]): Capability | "admin" {
  if (action === "permission" || action === "broadcast") return "admin";
  if (action === "privacy_status") return "privacy";
  return "support";
}
export function csvCell(value: unknown) {
  const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function rowsToCsv(rows: Record<string, unknown>[]) {
  const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
  return [columns.map(csvCell).join(","), ...rows.map(row => columns.map(key => csvCell(row[key])).join(","))].join("\r\n");
}