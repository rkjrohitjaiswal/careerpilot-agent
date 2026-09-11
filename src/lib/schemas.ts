import { z } from "zod";

export const toneSchema = z.enum(["coral", "mint", "gold", "ink"]);
export const prioritySchema = z.enum(["High", "Medium", "Low"]);
export const statusSchema = z.enum(["active", "next", "planned"]);
export const sourceSchema = z.enum(["demo", "provider"]);

export const scoreSchema = z.number().min(0).max(100);

export const skillSignalSchema = z.object({
  name: z.string(),
  current: scoreSchema,
  target: scoreSchema,
  priority: prioritySchema,
  recommendation: z.string(),
  tone: toneSchema,
});

export const careerPathSchema = z.object({
  title: z.string(),
  match: scoreSchema,
  salary: z.string(),
  explanation: z.string(),
  strengths: z.array(z.string()),
  missingSkills: z.array(z.string()),
  nextStep: z.string(),
  color: toneSchema,
});

export const roadmapItemSchema = z.object({
  title: z.string(),
  detail: z.string(),
  effort: z.string(),
  skills: z.array(z.string()),
  outcome: z.string(),
  status: statusSchema,
});

export const roadmapPhaseSchema = z.object({
  range: z.string(),
  title: z.string(),
  theme: z.string(),
  items: z.array(roadmapItemSchema),
});

export const projectSchema = z.object({
  name: z.string(),
  type: z.string(),
  difficulty: z.string(),
  skills: z.array(z.string()),
  outcome: z.string(),
  stack: z.array(z.string()),
  value: z.string(),
  color: toneSchema,
});

export const resumeFeedbackSchema = z.object({
  label: z.string(),
  title: z.string(),
  detail: z.string(),
  example: z.string().optional(),
});

export const resumePlanSchema = z.object({
  score: scoreSchema,
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  keywords: z.array(z.string()),
  feedback: z.array(resumeFeedbackSchema),
});

// Model Output Schema for Career Agent (without requiring trusted server metadata)
export const careerAgentOutputSchema = z.object({
  profileStrength: scoreSchema,
  topMatch: scoreSchema,
  roadmapProgress: scoreSchema,
  skills: z.array(skillSignalSchema),
  paths: z.array(careerPathSchema),
  roadmap: z.array(roadmapPhaseSchema).length(3),
  projects: z.array(projectSchema),
  resume: resumePlanSchema,
});

// Full Application CareerPlan Schema (includes trusted metadata)
export const careerPlanSchema = careerAgentOutputSchema.extend({
  source: sourceSchema,
  generatedAt: z.string(),
});

// Model Output Schema for Resume Agent (without requiring trusted server metadata)
export const resumeAgentOutputSchema = z.object({
  overallScore: scoreSchema,
  atsScore: scoreSchema,
  readabilityScore: scoreSchema,
  interviewReadiness: scoreSchema,
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missingSkills: z.array(z.string()),
  keywordSuggestions: z.array(z.string()),
  experienceSuggestions: z.array(z.string()),
  recommendedChanges: z.array(z.string()),
  suggestedTargetRoles: z.array(z.string()),
  actionItems: z.array(z.string()),
});

// Full Application ResumeAnalysis Schema (includes trusted metadata)
export const resumeAnalysisSchema = resumeAgentOutputSchema.extend({
  source: sourceSchema,
});
