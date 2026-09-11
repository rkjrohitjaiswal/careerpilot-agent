import { Agent } from "@strands-agents/sdk";
import { OpenAIModel } from "@strands-agents/sdk/models/openai";
import type { Profile } from "./career-data";
import { CAREER_ANALYSIS_PROMPT } from "./agent-prompts";
import { careerAgentOutputSchema } from "./schemas";

export function createCareerAgent(apiKey: string, modelId: string = "gpt-4o-mini"): Agent {
  const model = new OpenAIModel({
    apiKey,
    modelId,
    api: "chat",
  });

  return new Agent({
    name: "CareerPilotAgent",
    systemPrompt: CAREER_ANALYSIS_PROMPT,
    model,
    structuredOutputSchema: careerAgentOutputSchema,
    printer: false,
  });
}

export async function runCareerAgent(
  profile: Profile,
  options?: { timeoutMs?: number; apiKey?: string; modelId?: string }
): Promise<unknown> {
  const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const modelId = options?.modelId ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const agent = createCareerAgent(apiKey, modelId);

  const timeoutMs = options?.timeoutMs ?? 15000;
  const cancelSignal = AbortSignal.timeout(timeoutMs);

  const userPrompt = `Analyze the following complete candidate profile and generate a comprehensive CareerPlan structured output:
${JSON.stringify(profile, null, 2)}`;

  const result = await agent.invoke(userPrompt, { cancelSignal });

  if (result.structuredOutput) {
    return result.structuredOutput;
  }

  const textResponse = result.toString();
  if (textResponse) {
    return JSON.parse(textResponse);
  }

  throw new Error("CareerPilotAgent did not return structured output");
}
