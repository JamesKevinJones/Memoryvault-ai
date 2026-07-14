import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <PageHeader title="Settings" description="Workspace and account preferences." />
      <EmptyState
        icon={Settings}
        title="Nothing to configure yet"
        description="Workspace and account settings will land in a future milestone."
      />
    </div>
  );
}
