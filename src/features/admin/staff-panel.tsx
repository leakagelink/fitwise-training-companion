import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getOperationsIdentity } from "./operations.functions";
import { OperationsPanel } from "./operations-panel";
import type { Capability } from "./operations-model";
export function StaffPanel() {
  const identify = useServerFn(getOperationsIdentity);
  const identity = useQuery({ queryKey: ["staff-identity"], queryFn: () => identify(), staleTime: 0 });
  const [selected, setSelected] = useState<Capability | null>(null);
  const available = identity.data?.capabilities ?? [];
  const current = selected && available.includes(selected) ? selected : available[0];
  return <main className="mx-auto min-h-screen max-w-5xl space-y-6 px-5 py-8"><header className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-semibold">Muscles Zone staff workspace</h1><Button asChild variant="outline"><Link to="/profile">Back to profile</Link></Button></header>{identity.error && <p role="alert" className="text-destructive">{identity.error.message}</p>}{identity.isPending ? <p>Checking permissions…</p> : !current ? <p>No staff permissions assigned.</p> : <><nav aria-label="Staff workspace" className="flex flex-wrap gap-2">{available.map(c => <Button key={c} variant={current === c ? "secondary" : "ghost"} onClick={() => setSelected(c)}>{c}</Button>)}</nav><OperationsPanel key={current} section={current} /></>}</main>;
}