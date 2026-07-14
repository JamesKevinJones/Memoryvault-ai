export const BEDROCK_EMBED_MODEL_ID =
  process.env.BEDROCK_EMBED_MODEL_ID ?? "amazon.titan-embed-text-v2:0";

export const BEDROCK_EMBED_DIMENSIONS = Number(
  process.env.BEDROCK_EMBED_DIMENSIONS ?? "1024",
);

export const BEDROCK_CHAT_MODEL_ID =
  process.env.BEDROCK_CHAT_MODEL_ID ?? "amazon.nova-lite-v1:0";
