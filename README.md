# CareerPilot

CareerPilot is an AI-powered career assistant built for a hackathon demo. It turns a person's skills, education, experience, interests, and goals into a practical next-step workspace.

## Included in the demo

- Personalized career path matches with fit reasoning and salary ranges
- Skill signal analysis with progress indicators
- A 90-day learning roadmap with milestones
- Portfolio project recommendations
- Resume coaching with impact-focused rewrite suggestions
- Responsive dashboard navigation and profile editor
- Seeded demo data and a deterministic AI refresh flow for use without external APIs

## Architecture

CareerPilot uses Next.js, TypeScript, and the **Strands Agents SDK** (`@strands-agents/sdk`) as its core agent orchestration layer.

### Agent Workflow & Layering

```
/api/plan (Next.js Route)
  ↓
src/lib/ai-service.ts (Service Boundary)
  ↓
src/lib/career-agent.ts (CareerPilotAgent)
  ↓
Strands Agent + OpenAIModel (@strands-agents/sdk/models/openai)
  ↓
Zod Structured Output Schema (careerPlanSchema)
  ↓
Server-Enforced Trusted Metadata (source: "provider", generatedAt: "just now")
  ↓
isCareerPlan() Defensive Runtime Validation
  ↓
CareerPilot UI Component
```

- **Next.js & TypeScript**: Core application framework ensuring full type safety from API route to UI components.
- **Strands Agents SDK**: `Agent` instances (`CareerPilotAgent` and `ResumeCoachAgent`) orchestrate model invocations, handle structured outputs, and manage agent execution lifecycles.
- **Server-Side Model Provider**: `OpenAIModel` from `@strands-agents/sdk/models/openai` communicates with configured model providers securely on the server. Credentials (`OPENAI_API_KEY`) never leak to the client.
- **Zod Structured Output**: Strands Agents SDK uses Zod schemas (`careerPlanSchema` & `resumeAnalysisSchema`) to guarantee structured JSON responses matching domain contracts.
- **Runtime Validation & Metadata Enforcement**: Server code forces trusted metadata (`source: "provider"`, `generatedAt: "just now"`) and validates output through secondary `isCareerPlan()` / `isResumeAnalysis()` checks before returning to the UI.
- **Deterministic Demo Fallback**: If `OPENAI_API_KEY` is missing, or if the agent execution times out or encounters invalid model output, CareerPilot gracefully falls back to deterministic demo data (`demoPlan` / `demoResumeAnalysis`) with a user notice.

## Component Layout

- `src/components/CareerPilotApp.tsx`: Client interaction shell and presentation components.
- `src/lib/career-data.ts`: Shared TypeScript models, profile validation, and deterministic seeded data.
- `src/lib/schemas.ts`: Zod validation schemas for CareerPlan and ResumeAnalysis contracts.
- `src/lib/career-agent.ts`: Strands Agent definition for CareerPlan generation (`CareerPilotAgent`).
- `src/lib/resume-agent.ts`: Strands Agent definition for Resume analysis (`ResumeCoachAgent`).
- `src/lib/ai-service.ts`: Server-only service boundary, agent invocation wrapper, runtime validation, timeout, and demo fallback.
- `src/app/api/plan/route.ts`: Next.js server endpoint for generating career plans.
- `src/app/api/resume/route.ts`: Next.js server endpoint for resume analysis.
- `src/app/globals.css`: Warm paper, ink, coral, mint, and gold design system.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment variables

No environment variables are required for demo mode. To enable live career analysis, create `.env.local`:

```bash
OPENAI_API_KEY=your-server-side-key
# Optional; defaults to gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini
```

The provider request is made only from the server. If the key is missing, the provider times out, the network fails, the JSON is malformed, or the response does not match the expected shape, CareerPilot returns deterministic demo data and shows an explicit notice. `AI_REQUEST_TIMEOUT_MS` can optionally override the default 15-second timeout.

## Validate and build

```bash
npm run lint
npm run build
npm run start
```

## Demo mode

The app works without credentials. `POST /api/plan` returns seeded career matches, skill gaps, roadmap phases, projects, and resume coaching with `demoMode: true`. `POST /api/resume` requires at least 80 characters of resume text and returns clearly labeled deterministic demo feedback when no API key is configured. Profile edits and roadmap milestone completion are stored in the current browser only.

## Development commands

```bash
npm run dev       # local development
npm run lint      # ESLint
npm test          # focused contract, Zod, and Strands Agent tests
npm run build     # production compile and type check
npm run start     # serve the production build
```