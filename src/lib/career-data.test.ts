import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateRoadmapProgress, demoPlan, demoProfile, demoResumeAnalysis, isProfile } from "./career-data";
import { analyzeResume, generateCareerPlan, isCareerPlan, isResumeAnalysis } from "./ai-service";

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

  describe("AI provider error handling and fallback behavior", () => {
    const originalEnv = process.env.OPENAI_API_KEY;

    afterEach(() => {
      process.env.OPENAI_API_KEY = originalEnv;
      vi.unstubAllGlobals();
    });

    it("falls back to demo plan with notice on provider 500 error", async () => {
      process.env.OPENAI_API_KEY = "test-fake-key";
      vi.stubGlobal("fetch", async () => new Response("Internal Server Error", { status: 500 }));

      const result = await generateCareerPlan(demoProfile);
      expect(result.demoMode).toBe(true);
      expect(result.plan.source).toBe("demo");
      expect(result.notice).toContain("The AI provider returned an unusable response.");
    });

    it("falls back to demo plan with notice on malformed JSON content", async () => {
      process.env.OPENAI_API_KEY = "test-fake-key";
      vi.stubGlobal("fetch", async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { content: "invalid json string {" } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const result = await generateCareerPlan(demoProfile);
      expect(result.demoMode).toBe(true);
      expect(result.plan.source).toBe("demo");
      expect(result.notice).toContain("unusable response");
    });

    it("falls back to demo resume analysis on invalid schema shape", async () => {
      process.env.OPENAI_API_KEY = "test-fake-key";
      vi.stubGlobal("fetch", async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { content: JSON.stringify({ overallScore: "bad" }) } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const resumeText = "Experienced Marketing Lead with 5 years experience driving multi-channel growth campaigns, user retention metrics, SQL queries, and product discovery workshops.";
      const result = await analyzeResume({ resumeText, targetCareer: "Product Manager", profile: demoProfile });
      expect(result.demoMode).toBe(true);
      expect(result.analysis.source).toBe("demo");
      expect(result.notice).toContain("unusable resume analysis");
    });

    it("returns valid provider CareerPlan when provider responds with valid schema", async () => {
      process.env.OPENAI_API_KEY = "test-fake-key";
      const validPlan = {
        ...demoPlan,
        source: "provider",
      };
      vi.stubGlobal("fetch", async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { content: JSON.stringify(validPlan) } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const result = await generateCareerPlan(demoProfile);
      expect(result.demoMode).toBe(false);
      expect(result.plan.source).toBe("provider");
      expect(result.plan.profileStrength).toBe(demoPlan.profileStrength);
    });

    it("ensures trusted source and generatedAt fields override model output", async () => {
      process.env.OPENAI_API_KEY = "test-fake-key";
      const modelPlan = {
        ...demoPlan,
        source: "untrusted-source-override",
        generatedAt: "2020-01-01",
      };
      vi.stubGlobal("fetch", async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { content: JSON.stringify(modelPlan) } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const planResult = await generateCareerPlan(demoProfile);
      expect(planResult.demoMode).toBe(false);
      expect(planResult.plan.source).toBe("provider");
      expect(planResult.plan.generatedAt).toBe("just now");

      const modelAnalysis = {
        ...demoResumeAnalysis,
        source: "untrusted-source-override",
      };
      vi.stubGlobal("fetch", async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { content: JSON.stringify(modelAnalysis) } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const resumeText = "Experienced Marketing Lead with 5 years experience driving multi-channel growth campaigns, user retention metrics, SQL queries, and product discovery workshops.";
      const resumeResult = await analyzeResume({ resumeText, targetCareer: "Product Manager", profile: demoProfile });
      expect(resumeResult.demoMode).toBe(false);
      expect(resumeResult.analysis.source).toBe("provider");
    });

    it("returns valid provider ResumeAnalysis when provider responds with valid schema", async () => {
      process.env.OPENAI_API_KEY = "test-fake-key";
      const validAnalysis = {
        ...demoResumeAnalysis,
        source: "provider",
      };
      vi.stubGlobal("fetch", async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { content: JSON.stringify(validAnalysis) } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const resumeText = "Experienced Marketing Lead with 5 years experience driving multi-channel growth campaigns, user retention metrics, SQL queries, and product discovery workshops.";
      const result = await analyzeResume({ resumeText, targetCareer: "Product Manager", profile: demoProfile });
      expect(result.demoMode).toBe(false);
      expect(result.analysis.source).toBe("provider");
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


