import { EMBEDDING_DIMENSIONS } from "@/db/schema/embeddings";
import { env } from "@/lib/env";

// Functions, not constants: a `const` here would read the environment at
// module scope, and `next build` imports these modules to collect page data.
// A build should not need runtime configuration to succeed.
export const bedrockEmbedModelId = () => env().BEDROCK_EMBED_MODEL_ID;
export const bedrockChatModelId = () => env().BEDROCK_CHAT_MODEL_ID;

/**
 * Not configurable, deliberately.
 *
 * The embeddings column is declared `vector(1024)`; asking Bedrock for any
 * other width just makes every insert fail at runtime. The column type is the
 * source of truth, and changing it is a migration, not an environment
 * variable. Safe as a constant — it reads no environment.
 */
export const BEDROCK_EMBED_DIMENSIONS = EMBEDDING_DIMENSIONS;
