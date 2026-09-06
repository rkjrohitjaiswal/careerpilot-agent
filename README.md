# CareerPilot

CareerPilot is an AI-powered career assistant built for a hackathon demo. It turns a person&apos;s skills, education, experience, interests, and goals into a practical next-step workspace.

## Included in the demo

- Personalized career path matches with fit reasoning and salary ranges
- Skill signal analysis with progress indicators
- A 90-day learning roadmap with milestones
- Portfolio project recommendations
- Resume coaching with impact-focused rewrite suggestions
- Responsive dashboard navigation and profile editor
- Seeded demo data and a deterministic AI refresh flow for use without external APIs

## Architecture

- `src/components/CareerPilotApp.tsx` contains the client interaction shell and presentation components.
- `src/lib/career-data.ts` contains shared TypeScript models, profile validation, and deterministic seeded data.
- `src/lib/ai-service.ts` contains the server-only provider abstraction, OpenAI adapter, structured response validation, timeout, and demo fallback.
- `src/app/api/plan/route.ts` is the server endpoint used by the refresh flow. API keys never reach the browser.
- `src/app/api/resume/route.ts` validates resume input and returns structured resume coaching from the same server-only provider boundary.
- `src/app/globals.css` contains the warm paper, ink, coral, mint, and gold design system.

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
npm test          # focused contract and progress tests
npm run build     # production compile and type check
npm run start     # serve the production build
```

## Limitations

The live provider adapter currently targets OpenAI-compatible chat completions and expects the model to return the CareerPlan or ResumeAnalysis JSON contract. Provider output is validated before it reaches the UI. There is no database, authentication, or cross-device persistence yet.