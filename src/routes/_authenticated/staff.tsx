import { createFileRoute } from "@tanstack/react-router";
import { StaffPanel } from "@/features/admin/staff-panel";
export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({ meta: [
    { title: "Staff workspace — Muscles Zone" }, { name: "description", content: "Permission-scoped Muscles Zone support, billing, coaching and privacy operations." },
    { property: "og:title", content: "Muscles Zone Staff Workspace" }, { property: "og:description", content: "Restricted staff operations for Muscles Zone." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex,nofollow" },
  ] }), component: StaffPanel,
});