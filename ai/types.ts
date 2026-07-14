export type EmbedInput = {
  text: string;
};

export type EmbedResult = {
  vector: number[];
  modelId: string;
  dimensions: number;
};

export type RetrieveScope = {
  workspaceId: string;
  projectId?: string | null;
  category?: string;
  limit?: number;
};

export type RetrievedMemory = {
  memoryId: string;
  score: number;
  title: string;
  content: string;
  category: string;
  importance: number;
  projectId: string | null;
};

export type RetrieveResult = {
  items: RetrievedMemory[];
  retrievalCount: number;
};

export type ChatCitation = {
  memoryId: string;
  title: string;
  score?: number;
};

export type ChatPromptMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatPromptPack = {
  system: string;
  messages: ChatPromptMessage[];
  citations: ChatCitation[];
};

export type GenerateResult = {
  text: string;
  modelId: string;
};
