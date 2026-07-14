import { ChatWorkspace } from "@/features/chat/ui/chat-workspace";

type ChatPageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { projectId } = await searchParams;
  return <ChatWorkspace projectId={projectId} />;
}
