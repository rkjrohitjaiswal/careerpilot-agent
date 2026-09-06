import { NextResponse } from "next/server";
import { generateCareerPlan } from "@/lib/ai-service";
import { isProfile } from "@/lib/career-data";

export async function POST(request: Request) {
  try {
    const profile: unknown = await request.json();
    if (!isProfile(profile) || !profile.name.trim() || !profile.targetCareer.trim()) {
      return NextResponse.json({ error: "Add your name and target career before refreshing your plan." }, { status: 400 });
    }
    const result = await generateCareerPlan(profile);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "We couldn't refresh your plan. Please try again." }, { status: 500 });
  }
}
