import type {
  ChatCitation,
  ChatPromptMessage,
  ChatPromptPack,
} from "@/ai/types";
import type { Message } from "@/repositories/conversations";
import type { Memory } from "@/repositories/memories";
import type { Task } from "@/repositories/tasks";
import type { RetrievedMemory } from "@/ai/types";

export type BuildChatPromptInput = {
  retrievedMemories: RetrievedMemory[];
  pinnedMemories: Memory[];
  openTasks: Task[];
  recentMessages: Message[];
  userMessage: string;
};

function formatMemory(memory: {
  title: string;
  content: string;
  category: string;
  importance: number;
}): string {
  return `[${memory.category}] ${memory.title} (importance ${memory.importance})\n${memory.content}`;
}

export function buildChatPrompt(input: BuildChatPromptInput): ChatPromptPack {
  const citationMap = new Map<string, ChatCitation>();

  for (const memory of input.retrievedMemories) {
    citationMap.set(memory.memoryId, {
      memoryId: memory.memoryId,
      title: memory.title,
      score: memory.score,
    });
  }

  for (const memory of input.pinnedMemories) {
    if (!citationMap.has(memory.id)) {
      citationMap.set(memory.id, {
        memoryId: memory.id,
        title: memory.title,
        score: undefined,
      });
    }
  }

  const memoryBlocks = [
    ...input.pinnedMemories.map((memory) => formatMemory(memory)),
    ...input.retrievedMemories.map((memory) => formatMemory(memory)),
  ];

  const uniqueMemoryBlocks = [...new Set(memoryBlocks)];

  const taskLines = input.openTasks.map(
    (task) => `- [open] ${task.title}${task.dueAt ? ` (due ${task.dueAt.toISOString().slice(0, 10)})` : ""}`,
  );

  const system = [
    "You are MemoryVault AI, a personal assistant with durable long-term memory.",
    "Use the memory context below when answering. Cite relevant memories when helpful.",
    "If context is insufficient, say what you do not know.",
    "",
    "## Memory context",
    uniqueMemoryBlocks.length > 0
      ? uniqueMemoryBlocks.join("\n\n")
      : "(no memories retrieved)",
    "",
    "## Open tasks",
    taskLines.length > 0 ? taskLines.join("\n") : "(none)",
  ].join("\n");

  const history: ChatPromptMessage[] = input.recentMessages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

  const messages: ChatPromptMessage[] = [
    ...history,
    { role: "user", content: input.userMessage },
  ];

  return {
    system,
    messages,
    citations: [...citationMap.values()],
  };
}
