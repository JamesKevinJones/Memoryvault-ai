import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
        No memories yet
      </h1>
      <p className="text-muted-foreground leading-relaxed">
        Your vault is ready. Start a conversation and MemoryVault will begin
        learning what matters to you.
      </p>
      <Button render={<Link href="/chat" />} nativeButton={false}>
        Start a conversation
      </Button>
    </div>
  );
}
