import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  type ConverseStreamOutput,
} from "@aws-sdk/client-bedrock-runtime";
import { BEDROCK_CHAT_MODEL_ID } from "@/ai/config";
import type { ChatPromptMessage } from "@/ai/types";
import { getBedrockClient } from "@/ai/bedrock/embeddings";

export async function* streamConverse(input: {
  system: string;
  messages: ChatPromptMessage[];
}): AsyncGenerator<string> {
  const bedrock: BedrockRuntimeClient = getBedrockClient();

  const response = await bedrock.send(
    new ConverseStreamCommand({
      modelId: BEDROCK_CHAT_MODEL_ID,
      system: [{ text: input.system }],
      messages: input.messages.map((message) => ({
        role: message.role,
        content: [{ text: message.content }],
      })),
      inferenceConfig: {
        maxTokens: 1024,
        temperature: 0.4,
      },
    }),
  );

  if (!response.stream) {
    throw new Error("Bedrock returned empty stream");
  }

  for await (const event of response.stream as AsyncIterable<ConverseStreamOutput>) {
    const text = event.contentBlockDelta?.delta?.text;
    if (text) yield text;
  }
}
