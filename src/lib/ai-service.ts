import { demoPlan, demoResumeAnalysis, type CareerPlan, type Profile, type ResumeAnalysis } from "./career-data";
import { runCareerAgent } from "./career-agent";
import { runResumeAgent } from "./resume-agent";
import { CAREER_ANALYSIS_PROMPT, RESUME_ANALYSIS_PROMPT } from "./agent-prompts";

export { CAREER_ANALYSIS_PROMPT, RESUME_ANALYSIS_PROMPT };

export type PlanResult = { plan: CareerPlan; demoMode: boolean; notice?: string };
export type ResumeResult = { analysis: ResumeAnalysis; demoMode: boolean; notice?: string };
type AIProvider<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isString(value: unknown): value is string { return typeof value === "string"; }
function isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every(isString); }
function isNumber(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function isScore(value: unknown): value is number { return isNumber(value) && value >= 0 && value <= 100; }
function isTone(value: unknown): boolean { return ["coral", "mint", "gold", "ink"].includes(String(value)); }

export function isCareerPlan(value: unknown): value is CareerPlan {
  if (!isRecord(value) || !["demo", "provider"].includes(String(value.source)) || !isString(value.generatedAt)) return false;
  if (!["profileStrength", "topMatch", "roadmapProgress"].every((key) => isScore(value[key]))) return false;
  if (!Array.isArray(value.skills) || !Array.isArray(value.paths) || !Array.isArray(value.roadmap) || !Array.isArray(value.projects) || !isRecord(value.resume)) return false;
  const validSkills = value.skills.every((skill) => isRecord(skill) && isString(skill.name) && isScore(skill.current) && isScore(skill.target) && isString(skill.priority) && isString(skill.recommendation) && isTone(skill.tone));
  const validPaths = value.paths.every((path) => isRecord(path) && isString(path.title) && isScore(path.match) && isString(path.salary) && isString(path.explanation) && isStringArray(path.strengths) && isStringArray(path.missingSkills) && isString(path.nextStep) && isTone(path.color));
  const validRoadmap = value.roadmap.length === 3 && value.roadmap.every((phase) => isRecord(phase) && isString(phase.range) && isString(phase.title) && isString(phase.theme) && Array.isArray(phase.items) && phase.items.every((item) => isRecord(item) && isString(item.title) && isString(item.detail) && isString(item.effort) && isStringArray(item.skills) && isString(item.outcome) && isString(item.status)));
  const validProjects = value.projects.every((project) => isRecord(project) && isString(project.name) && isString(project.type) && isString(project.difficulty) && isStringArray(project.skills) && isString(project.outcome) && isStringArray(project.stack) && isString(project.value) && isTone(project.color));
  const resume = value.resume;
  const validResume = isRecord(resume) && isScore(resume.score) && isStringArray(resume.strengths) && isStringArray(resume.weaknesses) && isStringArray(resume.keywords) && Array.isArray(resume.feedback) && resume.feedback.every((item) => isRecord(item) && isString(item.label) && isString(item.title) && isString(item.detail));
  return validSkills && validPaths && validRoadmap && validProjects && validResume;
}

export function isResumeAnalysis(value: unknown): value is ResumeAnalysis {
  if (!isRecord(value) || !["demo", "provider"].includes(String(value.source))) return false;
  if (!isScore(value.overallScore) || !isScore(value.atsScore) || !isScore(value.readabilityScore) || !isScore(value.interviewReadiness)) return false;
  if (!isString(value.summary) || !isStringArray(value.strengths) || !isStringArray(value.weaknesses)) return false;
  if (!isStringArray(value.missingSkills) || !isStringArray(value.keywordSuggestions) || !isStringArray(value.experienceSuggestions)) return false;
  if (!isStringArray(value.recommendedChanges) || !isStringArray(value.suggestedTargetRoles) || !isStringArray(value.actionItems)) return false;
  return true;
}

export function getAIRequestTimeout(): number { const parsed = Number(process.env.AI_REQUEST_TIMEOUT_MS); return Number.isFinite(parsed) && parsed > 0 ? parsed : 15000; }

async function strandsCareerProvider(profile: Profile): Promise<CareerPlan> {
  const rawOutput = await runCareerAgent(profile, { timeoutMs: getAIRequestTimeout() });
  const candidate = isRecord(rawOutput) ? { ...rawOutput, source: "provider", generatedAt: "just now" } : rawOutput;
  if (!isCareerPlan(candidate)) throw new Error("career-invalid");
  return candidate;
}

async function strandsResumeProvider(input: { resumeText: string; targetCareer: string; profile?: Partial<Profile> }): Promise<ResumeAnalysis> {
  const rawOutput = await runResumeAgent(input, { timeoutMs: getAIRequestTimeout() });
  const candidate = isRecord(rawOutput) ? { ...rawOutput, source: "provider" } : rawOutput;
  if (!isResumeAnalysis(candidate)) throw new Error("resume-invalid");
  return candidate;
}

export async function generateCareerPlan(profile: Profile): Promise<PlanResult> {
  if (!process.env.OPENAI_API_KEY) return { plan: { ...demoPlan, generatedAt: "just now" }, demoMode: true };
  const provider: AIProvider<Profile, CareerPlan> = strandsCareerProvider;
  try { return { plan: await provider(profile), demoMode: false }; }
  catch (error) { const reason = error instanceof Error && error.name === "AbortError" ? "The AI request timed out." : "The AI provider returned an unusable response."; return { plan: { ...demoPlan, generatedAt: "just now" }, demoMode: true, notice: `${reason} Showing demo insights instead.` }; }
}

export async function analyzeResume(input: { resumeText: string; targetCareer: string; profile?: Partial<Profile> }): Promise<ResumeResult> {
  if (!input.resumeText.trim()) throw new Error("Resume text is required before analysis.");
  if (input.resumeText.trim().length < 80) throw new Error("Add at least 80 characters so the analysis has useful context.");
  if (!process.env.OPENAI_API_KEY) return { analysis: demoResumeAnalysis, demoMode: true, notice: "Demo resume feedback. Add an API key for provider-generated analysis." };
  const provider: AIProvider<{ resumeText: string; targetCareer: string; profile?: Partial<Profile> }, ResumeAnalysis> = strandsResumeProvider;
  try { return { analysis: await provider(input), demoMode: false }; }
  catch (error) { const reason = error instanceof Error && error.name === "AbortError" ? "The resume request timed out." : "The AI provider returned an unusable resume analysis."; return { analysis: demoResumeAnalysis, demoMode: true, notice: `${reason} Showing demo feedback instead.` }; }
}
