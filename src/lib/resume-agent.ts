import { Agent } from "@strands-agents/sdk";
import { OpenAIModel } from "@strands-agents/sdk/models/openai";
import type { Profile } from "./career-data";
import { RESUME_ANALYSIS_PROMPT } from "./agent-prompts";
import { resumeAgentOutputSchema } from "./schemas";

export type ResumeInput = {
  resumeText: string;
  targetCareer: string;
  profile?: Partial<Profile>;
};

export function createResumeAgent(apiKey: string, modelId: string = "gpt-4o-mini"): Agent {
  const model = new OpenAIModel({
    apiKey,
    modelId,
    api: "chat",
  });

  return new Agent({
    name: "ResumeCoachAgent",
    systemPrompt: RESUME_ANALYSIS_PROMPT,
    model,
    structuredOutputSchema: resumeAgentOutputSchema,
    printer: false,
  });
}

export async function runResumeAgent(
  input: ResumeInput,
  options?: { timeoutMs?: number; apiKey?: string; modelId?: string }
): Promise<unknown> {
  const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const modelId = options?.modelId ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const agent = createResumeAgent(apiKey, modelId);

  const timeoutMs = options?.timeoutMs ?? 15000;
  const cancelSignal = AbortSignal.timeout(timeoutMs);

  const userPrompt = `Analyze the following resume input for target career "${input.targetCareer}":
Resume Text:
${input.resumeText}

Candidate Profile Context:
${JSON.stringify(input.profile ?? {}, null, 2)}`;

  const result = await agent.invoke(userPrompt, { cancelSignal });

  if (result.structuredOutput) {
    return result.structuredOutput;
  }

  const textResponse = result.toString();
  if (textResponse) {
    return JSON.parse(textResponse);
  }

  throw new Error("ResumeCoachAgent did not return structured output");
}
