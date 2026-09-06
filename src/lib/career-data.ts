export type Tone = "coral" | "mint" | "gold" | "ink";

export type Profile = {
  name: string;
  status: string;
  targetCareer: string;
  experience: string;
  education: string;
  skills: string;
  interests: string;
  learningGoals: string;
  learningPreferences?: string;
  resumeText?: string;
};

export type SkillSignal = {
  name: string;
  current: number;
  target: number;
  priority: "High" | "Medium" | "Low";
  recommendation: string;
  tone: Tone;
};

export type CareerPath = {
  title: string;
  match: number;
  salary: string;
  explanation: string;
  strengths: string[];
  missingSkills: string[];
  nextStep: string;
  color: Tone;
};

export type RoadmapItem = {
  title: string;
  detail: string;
  effort: string;
  skills: string[];
  outcome: string;
  status: "active" | "next" | "planned";
};

export type RoadmapPhase = {
  range: string;
  title: string;
  theme: string;
  items: RoadmapItem[];
};

export type Project = {
  name: string;
  type: string;
  difficulty: string;
  skills: string[];
  outcome: string;
  stack: string[];
  value: string;
  color: Tone;
};

export type ResumeFeedback = {
  label: string;
  title: string;
  detail: string;
  example?: string;
};

export type BulletImprovement = {
  original: string;
  improved: string;
  reason: string;
};

export type ResumeAnalysis = {
  source: "demo" | "provider";
  overallScore: number;
  atsScore: number;
  readabilityScore: number;
  interviewReadiness: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  keywordSuggestions: string[];
  experienceSuggestions: string[];
  recommendedChanges: string[];
  suggestedTargetRoles: string[];
  actionItems: string[];
};

export type CareerPlan = {
  source: "demo" | "provider";
  generatedAt: string;
  profileStrength: number;
  topMatch: number;
  roadmapProgress: number;
  skills: SkillSignal[];
  paths: CareerPath[];
  roadmap: RoadmapPhase[];
  projects: Project[];
  resume: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    keywords: string[];
    feedback: ResumeFeedback[];
  };
};

export type CareerMatch = CareerPath;
export type SkillGap = SkillSignal;
export type Roadmap = RoadmapPhase;
export type Milestone = RoadmapItem;
export type ProjectRecommendation = Project;
export type AIAnalysis = CareerPlan;

export const demoProfile: Profile = {
  name: "Maya Chen",
  status: "Brand Marketer",
  targetCareer: "Product Manager",
  experience: "3 years in brand marketing",
  education: "BA Communications · University of Oregon",
  skills: "Product thinking, user research, marketing",
  interests: "Mission-driven products, education, climate",
  learningGoals: "Become confident with product analytics and case studies",
  learningPreferences: "Self-paced hands-on projects, 4 hrs/week",
  resumeText: "",
};

export function isProfile(value: unknown): value is Profile {
  if (typeof value !== "object" || value === null) return false;
  const profile = value as Record<string, unknown>;
  return ["name", "status", "targetCareer", "experience", "education", "skills", "interests", "learningGoals"]
    .every((key) => typeof profile[key] === "string")
    && (profile.learningPreferences === undefined || typeof profile.learningPreferences === "string")
    && (profile.resumeText === undefined || typeof profile.resumeText === "string");
}

export function calculateRoadmapProgress(completedCount: number, totalCount: number, fallback = 0): number {
  if (totalCount <= 0) return fallback;
  return Math.min(100, Math.max(0, Math.round((completedCount / totalCount) * 100)));
}

export const demoPlan: CareerPlan = {
  source: "demo",
  generatedAt: "just now",
  profileStrength: 78,
  topMatch: 94,
  roadmapProgress: 24,
  skills: [
    { name: "Product strategy", current: 82, target: 90, priority: "Low", recommendation: "Lead a small prioritization exercise and explain the tradeoffs.", tone: "coral" },
    { name: "User research", current: 68, target: 85, priority: "Medium", recommendation: "Run five structured interviews and synthesize the patterns.", tone: "mint" },
    { name: "Data storytelling", current: 44, target: 78, priority: "High", recommendation: "Rebuild one campaign report as an insight-led product memo.", tone: "gold" },
    { name: "SQL & analytics", current: 31, target: 70, priority: "High", recommendation: "Complete two SQL lessons, then query a public product dataset.", tone: "ink" },
  ],
  paths: [
    { title: "Product Manager", match: 94, salary: "$118k - $156k", explanation: "You find the signal in the noise and turn customer context into clear action.", strengths: ["Customer empathy", "Narrative clarity", "Cross-team influence"], missingSkills: ["SQL & analytics", "Product case studies"], nextStep: "Practice a metrics-led product case study", color: "coral" },
    { title: "UX Researcher", match: 88, salary: "$92k - $131k", explanation: "Your curiosity and empathy are a strong foundation for turning messy signals into clarity.", strengths: ["Interviewing", "Synthesis", "Communication"], missingSkills: ["Research operations", "Usability testing"], nextStep: "Run a five-person usability study", color: "mint" },
    { title: "Growth Strategist", match: 76, salary: "$105k - $145k", explanation: "Your marketing foundation gives you a useful commercial edge for high-velocity experiments.", strengths: ["Experiment mindset", "Messaging", "Audience insight"], missingSkills: ["Funnel analytics", "Experiment design"], nextStep: "Map an activation funnel from a public product", color: "gold" },
  ],
  roadmap: [
    { range: "DAYS 1–30", title: "Build your analytics foundation", theme: "Learn the language of product decisions", items: [{ title: "SQL for Product Analytics", detail: "Complete lessons 1–4 and query a public dataset.", effort: "4 weeks · 2 hrs/week", skills: ["SQL", "Metrics"], outcome: "Answer three product questions with data.", status: "active" }, { title: "Create a metric glossary", detail: "Define activation, retention, and conversion in your own words.", effort: "1 week · 45 min", skills: ["Product sense"], outcome: "A one-page reference for future case studies.", status: "next" }] },
    { range: "DAYS 31–60", title: "Practice product thinking", theme: "Turn insight into a defensible decision", items: [{ title: "Write a product case study", detail: "Frame a user problem, propose a solution, and name the tradeoffs.", effort: "3 weeks · 2 hrs/week", skills: ["Strategy", "Prioritization"], outcome: "A polished case study for your portfolio.", status: "planned" }, { title: "Shadow a product review", detail: "Ask a product leader how they use evidence to prioritize.", effort: "1 conversation", skills: ["Communication"], outcome: "A sharper picture of the day-to-day role.", status: "planned" }] },
    { range: "DAYS 61–90", title: "Ship a signal-rich portfolio", theme: "Show what you can do, not just what you know", items: [{ title: "Launch a feedback insights project", detail: "Analyze reviews, find a pattern, and pitch the product change.", effort: "5 weeks · 3 hrs/week", skills: ["Research", "Analytics", "Storytelling"], outcome: "A flagship portfolio piece with measurable reasoning.", status: "planned" }] },
  ],
  projects: [
    { name: "From messy feedback to a better product", type: "FLAGSHIP PROJECT", difficulty: "Advanced beginner", skills: ["SQL", "Research", "Product strategy"], outcome: "A portfolio case study that shows how you move from evidence to a product decision.", stack: ["Postgres", "Notion", "Figma"], value: "Shows product judgment", color: "coral" },
    { name: "Build a decision memo", type: "QUICK WIN · 1 WEEK", difficulty: "Beginner", skills: ["Prioritization", "Writing"], outcome: "A one-page recommendation with explicit tradeoffs and success metrics.", stack: ["Notion", "Google Sheets"], value: "Shows executive clarity", color: "mint" },
    { name: "Map a user journey", type: "QUICK WIN · 2 WEEKS", difficulty: "Beginner", skills: ["Interviewing", "Journey mapping"], outcome: "A visual story that connects user pain to an opportunity worth solving.", stack: ["FigJam", "Figma"], value: "Shows customer empathy", color: "gold" },
  ],
  resume: {
    score: 72,
    strengths: ["Clear communication", "Strong customer context", "Consistent career story"],
    weaknesses: ["Few measurable outcomes", "Limited product keywords", "No portfolio link"],
    keywords: ["roadmap", "prioritization", "activation", "SQL", "experimentation"],
    feedback: [
      { label: "MAKE IT MEASURABLE", title: "Swap responsibilities for outcomes", detail: "Lead with the change you created, then explain how you did it.", example: "Grew qualified inbound leads 34% through a new content system." },
      { label: "BRING THE PRODUCT LENS", title: "Connect research to decisions", detail: "Show how customer insights changed what a team built, prioritized, or stopped doing." },
      { label: "PASS THE ATS CHECK", title: "Add the language hiring teams scan for", detail: "Use role-specific terms naturally in your experience bullets and project descriptions." },
    ],
  },
};

export const demoResumeAnalysis: ResumeAnalysis = {
  source: "demo",
  overallScore: 72,
  atsScore: 68,
  readabilityScore: 82,
  interviewReadiness: 75,
  summary: "Your resume tells a clear career story with strong communication skills and customer focus. Adding measurable outcomes and product keywords will significantly improve both ATS matching and interview conversations.",
  strengths: ["Clear communication", "Strong customer context", "Consistent career story"],
  weaknesses: ["Few measurable outcomes", "Limited product keywords", "No portfolio link"],
  missingSkills: ["Quantified impact statements", "Product management terminology", "Data-driven decision examples"],
  keywordSuggestions: ["roadmap", "prioritization", "activation", "SQL", "experimentation", "metrics", "OKR"],
  experienceSuggestions: [
    "Grew qualified inbound leads 34% through a new content system",
    "Aligned brand, sales, and product partners around a quarterly launch narrative",
    "Reduced customer acquisition cost 28% by testing three messaging angles"
  ],
  recommendedChanges: [
    "Reformat work history bullet points to emphasize quantifiable impact",
    "Add technical skills section with analytics and product management tools",
    "Include direct links to portfolio memos and data projects"
  ],
  suggestedTargetRoles: [
    "Product Manager",
    "Associate Product Manager",
    "Product Marketing Manager"
  ],
  actionItems: [
    "Add a portfolio link and GitHub profile to contact section",
    "Rewrite bullets with format: [Action] [What] [Result with %]",
    "Add a dedicated Projects section highlighting analytical and strategic work",
    "Include 2-3 examples with concrete metrics (growth %, cost savings, engagement lift)"
  ]
};
