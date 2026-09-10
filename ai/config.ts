import { EMBEDDING_DIMENSIONS } from "@/db/schema/embeddings";
import { env } from "@/lib/env";

export const BEDROCK_EMBED_MODEL_ID = env().BEDROCK_EMBED_MODEL_ID;
export const BEDROCK_CHAT_MODEL_ID = env().BEDROCK_CHAT_MODEL_ID;

/**
 * Not configurable, deliberately.
 *
 * The embeddings column is declared `vector(1024)`; asking Bedrock for any
 * other width just makes every insert fail at runtime. The column type is the
 * source of truth, and changing it is a migration, not an environment
 * variable.
 */
export const BEDROCK_EMBED_DIMENSIONS = EMBEDDING_DIMENSIONS;
