import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  BEDROCK_EMBED_DIMENSIONS,
  BEDROCK_EMBED_MODEL_ID,
} from "@/ai/config";

let client: BedrockRuntimeClient | null = null;

export function getBedrockClient(): BedrockRuntimeClient {
  if (!client) {
    client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION ?? "us-east-1",
    });
  }
  return client;
}

export async function invokeEmbedding(text: string): Promise<number[]> {
  const bedrock = getBedrockClient();
  const body = JSON.stringify({
    inputText: text,
    dimensions: BEDROCK_EMBED_DIMENSIONS,
    normalize: true,
  });

  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: BEDROCK_EMBED_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: Buffer.from(body),
    }),
  );

  const payload = JSON.parse(
    new TextDecoder().decode(response.body),
  ) as { embedding?: number[] };

  if (!payload.embedding?.length) {
    throw new Error("Bedrock returned empty embedding");
  }

  return payload.embedding;
}
