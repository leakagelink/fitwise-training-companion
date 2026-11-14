import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function ScreenLoadError() {
  const router = useRouter();
  return <div role="alert" className="space-y-3 p-6"><p>This screen could not load.</p><Button variant="outline" onClick={() => void router.invalidate()}>Try again</Button></div>;
}

export function ScreenNotFound() {
  return <p className="p-6">This page is not available.</p>;
}