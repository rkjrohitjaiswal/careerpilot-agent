import { demoPlan, demoResumeAnalysis, type CareerPlan, type Profile, type ResumeAnalysis } from "./career-data";

export type PlanResult = { plan: CareerPlan; demoMode: boolean; notice?: string };
export type ResumeResult = { analysis: ResumeAnalysis; demoMode: boolean; notice?: string };
type AIProvider<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

export const CAREER_ANALYSIS_PROMPT = `You are CareerPilot, an expert career strategist. Analyze the user's complete profile: name, current status/role, experience, education, skills, interests, target career (targetCareer), learning goals (learningGoals), and learning preferences (learningPreferences).

Return ONLY valid JSON matching the CareerPlan contract:
{
  "source": "provider",
  "generatedAt": "just now",
  "profileStrength": number (0-100),
  "topMatch": number (0-100),
  "roadmapProgress": number (0-100),
  "skills": [
    {
      "name": string,
      "current": number (0-100),
      "target": number (0-100),
      "priority": "High" | "Medium" | "Low",
      "recommendation": string,
      "tone": "coral" | "mint" | "gold" | "ink"
    }
  ],
  "paths": [
    {
      "title": string,
      "match": number (0-100),
      "salary": string (e.g. "$110k - $145k"),
      "explanation": string,
      "strengths": string[],
      "missingSkills": string[],
      "nextStep": string,
      "color": "coral" | "mint" | "gold" | "ink"
    }
  ],
  "roadmap": [
    {
      "range": string (e.g. "DAYS 1–30"),
      "title": string,
      "theme": string,
      "items": [
        {
          "title": string,
          "detail": string,
          "effort": string,
          "skills": string[],
          "outcome": string,
          "status": "active" | "next" | "planned"
        }
      ]
    }
  ],
  "projects": [
    {
      "name": string,
      "type": string,
      "difficulty": string,
      "skills": string[],
      "outcome": string,
      "stack": string[],
      "value": string,
      "color": "coral" | "mint" | "gold" | "ink"
    }
  ],
  "resume": {
    "score": number (0-100),
    "strengths": string[],
    "weaknesses": string[],
    "keywords": string[],
    "feedback": [
      {
        "label": string,
        "title": string,
        "detail": string
      }
    ]
  }
}

Requirements:
- The "roadmap" array MUST contain EXACTLY three phases (e.g. "DAYS 1–30", "DAYS 31–60", "DAYS 61–90").
- "tone" and "color" MUST be one of: "coral", "mint", "gold", "ink".
- "priority" MUST be one of: "High", "Medium", "Low".
- "status" MUST be one of: "active", "next", "planned".
- Connect all skill gaps, paths, roadmap items, projects, and resume advice directly to the user's name, current background, target career, learning goals, and learning preferences. Never invent fake personal information.`;

export const RESUME_ANALYSIS_PROMPT = "You are CareerPilot Resume Coach. Analyze the supplied resume text for the target career and user profile. Return only valid JSON matching the ResumeAnalysis contract: { source: 'provider', overallScore (0-100), atsScore (0-100), readabilityScore (0-100), interviewReadiness (0-100), summary (concise paragraph), strengths (3-4 strings), weaknesses (3-4 strings), missingSkills (3-4 strings), keywordSuggestions (5-7 strings), experienceSuggestions (2-3 improved bullet examples), recommendedChanges (3-4 specific recommended changes), suggestedTargetRoles (2-4 relevant target job titles), actionItems (3-5 prioritized action steps) }. Never claim to have analyzed missing text. Always ground feedback in the actual resume content.";


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
  const validResume = isScore(resume.score) && isStringArray(resume.strengths) && isStringArray(resume.weaknesses) && isStringArray(resume.keywords) && Array.isArray(resume.feedback) && resume.feedback.every((item) => isRecord(item) && isString(item.label) && isString(item.title) && isString(item.detail));
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

async function requestOpenAI(prompt: string, input: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getAIRequestTimeout());
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", temperature: 0.3, response_format: { type: "json_object" }, messages: [{ role: "system", content: prompt }, { role: "user", content: JSON.stringify(input) }] }),
    });
    if (!response.ok) throw new Error(`provider-${response.status}`);
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("provider-empty");
    return JSON.parse(content) as unknown;
  } finally { clearTimeout(timeout); }
}

async function openAICareerProvider(profile: Profile): Promise<CareerPlan> {
  const parsed = await requestOpenAI(CAREER_ANALYSIS_PROMPT, { profile, schema: "CareerPlan" });
  const candidate = isRecord(parsed) ? { ...parsed, source: "provider", generatedAt: "just now" } : parsed;
  if (!isCareerPlan(candidate)) throw new Error("career-invalid");
  return candidate;
}

async function openAIResumeProvider(input: { resumeText: string; targetCareer: string; profile?: Partial<Profile> }): Promise<ResumeAnalysis> {
  const parsed = await requestOpenAI(RESUME_ANALYSIS_PROMPT, { ...input, schema: "ResumeAnalysis" });
  const candidate = isRecord(parsed) ? { ...parsed, source: "provider" } : parsed;
  if (!isResumeAnalysis(candidate)) throw new Error("resume-invalid");
  return candidate;
}

export async function generateCareerPlan(profile: Profile): Promise<PlanResult> {
  if (!process.env.OPENAI_API_KEY) return { plan: { ...demoPlan, generatedAt: "just now" }, demoMode: true };
  const provider: AIProvider<Profile, CareerPlan> = openAICareerProvider;
  try { return { plan: await provider(profile), demoMode: false }; }
  catch (error) { const reason = error instanceof Error && error.name === "AbortError" ? "The AI request timed out." : "The AI provider returned an unusable response."; return { plan: { ...demoPlan, generatedAt: "just now" }, demoMode: true, notice: `${reason} Showing demo insights instead.` }; }
}

export async function analyzeResume(input: { resumeText: string; targetCareer: string; profile?: Partial<Profile> }): Promise<ResumeResult> {
  if (!input.resumeText.trim()) throw new Error("Resume text is required before analysis.");
  if (input.resumeText.trim().length < 80) throw new Error("Add at least 80 characters so the analysis has useful context.");
  if (!process.env.OPENAI_API_KEY) return { analysis: demoResumeAnalysis, demoMode: true, notice: "Demo resume feedback. Add an API key for provider-generated analysis." };
  const provider: AIProvider<{ resumeText: string; targetCareer: string; profile?: Partial<Profile> }, ResumeAnalysis> = openAIResumeProvider;
  try { return { analysis: await provider(input), demoMode: false }; }
  catch (error) { const reason = error instanceof Error && error.name === "AbortError" ? "The resume request timed out." : "The AI provider returned an unusable resume analysis."; return { analysis: demoResumeAnalysis, demoMode: true, notice: `${reason} Showing demo feedback instead.` }; }
}
