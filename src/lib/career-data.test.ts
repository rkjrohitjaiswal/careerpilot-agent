import { describe, expect, it } from "vitest";
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
});
