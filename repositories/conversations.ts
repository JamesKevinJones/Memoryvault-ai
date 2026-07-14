import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { conversations, messages } from "@/db/schema";

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

export async function getConversation(
  workspaceId: string,
  id: string,
): Promise<Conversation | null> {
  const [row] = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.id, id), eq(conversations.workspaceId, workspaceId)),
    )
    .limit(1);

  return row ?? null;
}

export async function createConversation(input: {
  workspaceId: string;
  projectId?: string | null;
  title?: string | null;
}): Promise<Conversation> {
  const now = new Date();
  const id = crypto.randomUUID();

  const [row] = await db
    .insert(conversations)
    .values({
      id,
      workspaceId: input.workspaceId,
      projectId: input.projectId ?? null,
      title: input.title ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return row;
}

export async function touchConversation(id: string) {
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function createMessage(input: {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
}): Promise<Message> {
  const [row] = await db
    .insert(messages)
    .values({
      id: crypto.randomUUID(),
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      createdAt: new Date(),
    })
    .returning();

  return row;
}

export async function listRecentMessages(
  conversationId: string,
  limit = 8,
): Promise<Message[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return rows.reverse();
}
