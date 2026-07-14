import { index, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";
import { memories } from "./memories";

export const EMBEDDING_DIMENSIONS = 1024;

export const embeddings = pgTable(
  "embeddings",
  {
    id: text("id").primaryKey(),
    memoryId: text("memory_id")
      .notNull()
      .unique()
      .references(() => memories.id, { onDelete: "cascade" }),
    modelId: text("model_id").notNull(),
    dimensions: integer("dimensions").notNull(),
    vector: vector("vector", { dimensions: EMBEDDING_DIMENSIONS }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("embeddings_vector_cosine_idx").using(
      "hnsw",
      t.vector.op("vector_cosine_ops"),
    ),
  ],
);
