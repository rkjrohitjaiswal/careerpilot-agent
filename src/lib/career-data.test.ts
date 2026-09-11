import { afterEach, describe, expect, it, vi } from "vitest";
import { Agent, AgentResult, Message, TextBlock } from "@strands-agents/sdk";
import { calculateRoadmapProgress, demoPlan, demoProfile, demoResumeAnalysis, isProfile } from "./career-data";
import { analyzeResume, generateCareerPlan, isCareerPlan, isResumeAnalysis } from "./ai-service";
import { careerAgentOutputSchema, careerPlanSchema, resumeAgentOutputSchema, resumeAnalysisSchema } from "./schemas";
import { runCareerAgent } from "./career-agent";
import { runResumeAgent } from "./resume-agent";
import { CAREER_ANALYSIS_PROMPT, RESUME_ANALYSIS_PROMPT } from "./agent-prompts";

describe("career data contracts", () => {
  it("accepts a complete profile and rejects incomplete input", () => {
    expect(isProfile(demoProfile)).toBe(true);
    expect(isProfile({ ...demoProfile, targetCareer: undefined })).toBe(false);
    expect(isProfile({})).toBe(false);
  });

  it("validates the seeded career plan and rejects malformed AI output", () => {
    expect(isCareerPlan(demoPlan)).toBe(true);
    expect(isCareerPlan({ ...demoPlan, paths: "not-an-array" })).toBe(false);
    expect(isCareerPlan({})).toBe(false);
  });

  it("calculates bounded roadmap progress", () => {
    expect(calculateRoadmapProgress(1, 5)).toBe(20);
    expect(calculateRoadmapProgress(10, 5)).toBe(100);
    expect(calculateRoadmapProgress(-1, 5)).toBe(0);
    expect(calculateRoadmapProgress(0, 0, 24)).toBe(24);
  });

  it("validates seeded demo resume analysis and rejects malformed resume output", () => {
    expect(isResumeAnalysis(demoResumeAnalysis)).toBe(true);
    expect(isResumeAnalysis({ source: "demo", overallScore: 70 })).toBe(false);
    expect(isResumeAnalysis({ ...demoResumeAnalysis, overallScore: "eighty" })).toBe(false);
  });

  it("analyzeResume returns demo fallback result when API key is missing", async () => {
    const resumeText = "Experienced Marketing Lead with 5 years experience driving multi-channel growth campaigns, user retention metrics, SQL queries, and product discovery workshops.";
    const result = await analyzeResume({ resumeText, targetCareer: "Product Manager", profile: demoProfile });
    expect(result.demoMode).toBe(true);
    expect(result.analysis.source).toBe("demo");
    expect(result.analysis.overallScore).toBeGreaterThan(0);
    expect(result.analysis.suggestedTargetRoles.length).toBeGreaterThan(0);
  });

  it("analyzeResume throws error on invalid/short input", async () => {
    await expect(analyzeResume({ resumeText: "", targetCareer: "PM" })).rejects.toThrow("Resume text is required before analysis.");
    await expect(analyzeResume({ resumeText: "Too short resume text", targetCareer: "PM" })).rejects.toThrow("Add at least 80 characters so the analysis has useful context.");
  });

  it("generateCareerPlan returns demo plan when API key is missing", async () => {
    const result = await generateCareerPlan(demoProfile);
    expect(result.demoMode).toBe(true);
    expect(result.plan.source).toBe("demo");
  });

  describe("architecture & circular dependency checks", () => {
    it("exports prompts from agent-prompts without circular initialization issues", () => {
      expect(typeof CAREER_ANALYSIS_PROMPT).toBe("string");
      expect(CAREER_ANALYSIS_PROMPT.length).toBeGreaterThan(100);
      expect(typeof RESUME_ANALYSIS_PROMPT).toBe("string");
      expect(RESUME_ANALYSIS_PROMPT.length).toBeGreaterThan(50);
    });
  });

  describe("Zod schema validation & decoupled model outputs", () => {
    it("model output schema validates CareerPlan data without source/generatedAt", () => {
      const modelRawOutput = { ...demoPlan } as Record<string, unknown>;
      delete modelRawOutput.source;
      delete modelRawOutput.generatedAt;
      const parsed = careerAgentOutputSchema.safeParse(modelRawOutput);
      expect(parsed.success).toBe(true);
    });

    it("full application careerPlanSchema validates complete CareerPlan with metadata", () => {
      const parsed = careerPlanSchema.safeParse(demoPlan);
      expect(parsed.success).toBe(true);
    });

    it("model output schema validates ResumeAnalysis data without source", () => {
      const modelRawOutput = { ...demoResumeAnalysis } as Record<string, unknown>;
      delete modelRawOutput.source;
      const parsed = resumeAgentOutputSchema.safeParse(modelRawOutput);
      expect(parsed.success).toBe(true);
    });

    it("full application resumeAnalysisSchema validates complete ResumeAnalysis with metadata", () => {
      const parsed = resumeAnalysisSchema.safeParse(demoResumeAnalysis);
      expect(parsed.success).toBe(true);
    });

    it("rejects CareerPlan with roadmap phase count != 3", () => {
      const invalidPlan = {
        ...demoPlan,
        roadmap: [demoPlan.roadmap[0], demoPlan.roadmap[1]],
      };
      expect(careerAgentOutputSchema.safeParse(invalidPlan).success).toBe(false);
      expect(careerPlanSchema.safeParse(invalidPlan).success).toBe(false);
    });

    it("rejects CareerPlan with score < 0 or > 100", () => {
      expect(careerAgentOutputSchema.safeParse({ ...demoPlan, profileStrength: -5 }).success).toBe(false);
      expect(careerAgentOutputSchema.safeParse({ ...demoPlan, profileStrength: 105 }).success).toBe(false);
    });

    it("rejects ResumeAnalysis with score < 0 or > 100", () => {
      expect(resumeAgentOutputSchema.safeParse({ ...demoResumeAnalysis, overallScore: -1 }).success).toBe(false);
      expect(resumeAgentOutputSchema.safeParse({ ...demoResumeAnalysis, overallScore: 101 }).success).toBe(false);
    });
  });

  describe("Strands Agents SDK integration and fallback behavior", () => {
    const originalEnv = process.env.OPENAI_API_KEY;

    afterEach(() => {
      process.env.OPENAI_API_KEY = originalEnv;
      vi.restoreAllMocks();
    });

    it("returns valid provider CareerPlan when Strands Agent returns valid structured output without server metadata", async () => {
      process.env.OPENAI_API_KEY = "test-fake-key";
      const modelRawOutput = { ...demoPlan } as Record<string, unknown>;
      delete modelRawOutput.source;
      delete modelRawOutput.generatedAt;

      vi.spyOn(Agent.prototype, "invoke").mockResolvedValue(
        new AgentResult({
          stopReason: "end_turn",
          lastMessage: new Message({ role: "assistant", content: [new TextBlock("ok")] }),
          invocationState: {},
          structuredOutput: modelRawOutput,
        })
      );

      const result = await generateCareerPlan(demoProfile);
      expect(result.demoMode).toBe(false);
      expect(result.plan.source).toBe("provider");
      expect(result.plan.generatedAt).toBe("just now");
      expect(result.plan.profileStrength).toBe(demoPlan.profileStrength);
    });

    it("ensures server code forces trusted source and generatedAt metadata regardless of model output", async () => {
      process.env.OPENAI_API_KEY = "test-fake-key";
      const modelPlanWithUntrustedMetadata = {
        ...demoPlan,
        source: "fake-untrusted-source",
        generatedAt: "2000-01-01",
      };

      vi.spyOn(Agent.prototype, "invoke").mockResolvedValue(
        new AgentResult({
          stopReason: "end_turn",
          lastMessage: new Message({ role: "assistant", content: [new TextBlock("ok")] }),
          invocationState: {},
          structuredOutput: modelPlanWithUntrustedMetadata,
        })
      );

      const planResult = await generateCareerPlan(demoProfile);
      expect(planResult.demoMode).toBe(false);
      expect(planResult.plan.source).toBe("provider");
      expect(planResult.plan.generatedAt).toBe("just now");

      const modelAnalysisWithUntrustedMetadata = {
        ...demoResumeAnalysis,
        source: "fake-untrusted-source",
      };

      vi.spyOn(Agent.prototype, "invoke").mockResolvedValue(
        new AgentResult({
          stopReason: "end_turn",
          lastMessage: new Message({ role: "assistant", content: [new TextBlock("ok")] }),
          invocationState: {},
          structuredOutput: modelAnalysisWithUntrustedMetadata,
        })
      );

      const resumeText = "Experienced Marketing Lead with 5 years experience driving multi-channel growth campaigns, user retention metrics, SQL queries, and product discovery workshops.";
      const resumeResult = await analyzeResume({ resumeText, targetCareer: "Product Manager", profile: demoProfile });
      expect(resumeResult.demoMode).toBe(false);
      expect(resumeResult.analysis.source).toBe("provider");
    });

    it("falls back to demo plan with notice on Strands Agent error", async () => {
      process.env.OPENAI_API_KEY = "test-fake-key";
      vi.spyOn(Agent.prototype, "invoke").mockRejectedValue(new Error("Strands agent error"));

      const result = await generateCareerPlan(demoProfile);
      expect(result.demoMode).toBe(true);
      expect(result.plan.source).toBe("demo");
      expect(result.notice).toContain("The AI provider returned an unusable response.");
    });

    it("falls back to demo plan when score is outside 0-100", async () => {
      process.env.OPENAI_API_KEY = "test-fake-key";
      const invalidPlan = {
        ...demoPlan,
        profileStrength: 150,
      };

      vi.spyOn(Agent.prototype, "invoke").mockResolvedValue(
        new AgentResult({
          stopReason: "end_turn",
          lastMessage: new Message({ role: "assistant", content: [new TextBlock("ok")] }),
          invocationState: {},
          structuredOutput: invalidPlan,
        })
      );

      const result = await generateCareerPlan(demoProfile);
      expect(result.demoMode).toBe(true);
      expect(result.plan.source).toBe("demo");
      expect(result.notice).toContain("unusable response");
    });

    it("falls back to demo plan when roadmap phase count is not exactly 3", async () => {
      process.env.OPENAI_API_KEY = "test-fake-key";
      const invalidPlan = {
        ...demoPlan,
        roadmap: [demoPlan.roadmap[0], demoPlan.roadmap[1]],
      };

      vi.spyOn(Agent.prototype, "invoke").mockResolvedValue(
        new AgentResult({
          stopReason: "end_turn",
          lastMessage: new Message({ role: "assistant", content: [new TextBlock("ok")] }),
          invocationState: {},
          structuredOutput: invalidPlan,
        })
      );

      const result = await generateCareerPlan(demoProfile);
      expect(result.demoMode).toBe(true);
      expect(result.plan.source).toBe("demo");
      expect(result.notice).toContain("unusable response");
    });

    it("returns valid provider ResumeAnalysis when Strands Resume Coach Agent returns valid output", async () => {
      process.env.OPENAI_API_KEY = "test-fake-key";
      const modelRawOutput = { ...demoResumeAnalysis } as Record<string, unknown>;
      delete modelRawOutput.source;

      vi.spyOn(Agent.prototype, "invoke").mockResolvedValue(
        new AgentResult({
          stopReason: "end_turn",
          lastMessage: new Message({ role: "assistant", content: [new TextBlock("ok")] }),
          invocationState: {},
          structuredOutput: modelRawOutput,
        })
      );

      const resumeText = "Experienced Marketing Lead with 5 years experience driving multi-channel growth campaigns, user retention metrics, SQL queries, and product discovery workshops.";
      const result = await analyzeResume({ resumeText, targetCareer: "Product Manager", profile: demoProfile });
      expect(result.demoMode).toBe(false);
      expect(result.analysis.source).toBe("provider");
    });

    it("runCareerAgent throws when missing OPENAI_API_KEY", async () => {
      delete process.env.OPENAI_API_KEY;
      await expect(runCareerAgent(demoProfile, { apiKey: "" })).rejects.toThrow("Missing OPENAI_API_KEY");
    });

    it("runResumeAgent throws when missing OPENAI_API_KEY", async () => {
      delete process.env.OPENAI_API_KEY;
      await expect(runResumeAgent({ resumeText: "long enough resume text with 80+ chars", targetCareer: "PM" }, { apiKey: "" })).rejects.toThrow("Missing OPENAI_API_KEY");
    });
  });

  describe("strict score bounds validation (0-100)", () => {
    it("rejects CareerPlan with scores outside 0-100", () => {
      expect(isCareerPlan({ ...demoPlan, profileStrength: -1 })).toBe(false);
      expect(isCareerPlan({ ...demoPlan, profileStrength: 101 })).toBe(false);
      expect(isCareerPlan({ ...demoPlan, topMatch: 150 })).toBe(false);
      expect(isCareerPlan({ ...demoPlan, roadmapProgress: -10 })).toBe(false);
      expect(isCareerPlan({ ...demoPlan, skills: [{ ...demoPlan.skills[0], current: 105 }] })).toBe(false);
      expect(isCareerPlan({ ...demoPlan, paths: [{ ...demoPlan.paths[0], match: -5 }] })).toBe(false);
      expect(isCareerPlan({ ...demoPlan, resume: { ...demoPlan.resume, score: 200 } })).toBe(false);
    });

    it("rejects ResumeAnalysis with scores outside 0-100", () => {
      expect(isResumeAnalysis({ ...demoResumeAnalysis, overallScore: -1 })).toBe(false);
      expect(isResumeAnalysis({ ...demoResumeAnalysis, atsScore: 105 })).toBe(false);
      expect(isResumeAnalysis({ ...demoResumeAnalysis, readabilityScore: 150 })).toBe(false);
      expect(isResumeAnalysis({ ...demoResumeAnalysis, interviewReadiness: -10 })).toBe(false);
    });

    it("accepts valid scores at boundaries (0 and 100)", () => {
      expect(isCareerPlan({ ...demoPlan, profileStrength: 0, topMatch: 100, roadmapProgress: 0 })).toBe(true);
      expect(isResumeAnalysis({ ...demoResumeAnalysis, overallScore: 0, atsScore: 100, readabilityScore: 0, interviewReadiness: 100 })).toBe(true);
    });
  });
});
