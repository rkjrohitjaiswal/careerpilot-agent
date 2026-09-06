import { describe, expect, it } from "vitest";
import { calculateRoadmapProgress, demoPlan, demoProfile, isProfile } from "./career-data";
import { isCareerPlan, isResumeAnalysis } from "./ai-service";

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

  it("rejects malformed resume output", () => {
    expect(isResumeAnalysis({ source: "demo", overallScore: 70 })).toBe(false);
  });
});
