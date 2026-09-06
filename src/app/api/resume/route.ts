import { NextResponse } from "next/server";
import { analyzeResume } from "@/lib/ai-service";
import { isProfile } from "@/lib/career-data";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) return NextResponse.json({ error: "Send resume text to analyze." }, { status: 400 });
    const input = body as { resumeText?: unknown; targetCareer?: unknown; profile?: unknown };
    if (typeof input.resumeText !== "string" || input.resumeText.trim().length < 80) return NextResponse.json({ error: "Add at least 80 characters so the analysis has useful context." }, { status: 400 });
    if (typeof input.targetCareer !== "string" || !input.targetCareer.trim()) return NextResponse.json({ error: "Add a target career before analyzing your resume." }, { status: 400 });
    if (input.profile !== undefined && !isProfile(input.profile)) return NextResponse.json({ error: "Profile details are malformed. Please refresh and try again." }, { status: 400 });
    return NextResponse.json(await analyzeResume({ resumeText: input.resumeText, targetCareer: input.targetCareer, profile: input.profile }));
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Resume data was not valid JSON." }, { status: 400 });
    return NextResponse.json({ error: "We couldn't analyze your resume. Please try again." }, { status: 500 });
  }
}
