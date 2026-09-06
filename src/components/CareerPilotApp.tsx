"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight, Bell, BookOpen, BriefcaseBusiness, Check, ChevronRight, CircleUserRound,
  FileText, Gauge, GraduationCap, LayoutDashboard, Lightbulb, LoaderCircle, Menu, Pencil,
  Plus, Sparkles, Target, X,
} from "lucide-react";
import { calculateRoadmapProgress, demoPlan, demoProfile, type CareerPath, type CareerPlan, type Profile, type ResumeAnalysis } from "@/lib/career-data";

type Tab = "overview" | "paths" | "roadmap" | "projects" | "resume";
const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "paths", label: "Career paths", icon: BriefcaseBusiness },
  { id: "roadmap", label: "Learning roadmap", icon: BookOpen },
  { id: "projects", label: "Projects", icon: Lightbulb },
  { id: "resume", label: "Resume coach", icon: FileText },
];

export default function CareerPilotApp() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [profile, setProfile] = useState<Profile>(demoProfile);
  const [plan, setPlan] = useState<CareerPlan>(demoPlan);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem("careerpilot-profile");
    if (saved) {
      window.setTimeout(() => {
        try { setProfile({ ...demoProfile, ...JSON.parse(saved) }); } catch { window.localStorage.removeItem("careerpilot-profile"); }
      }, 0);
    }
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setShowProfile(false); setSelectedPath(null); setMobileNavOpen(false); }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function generatePlan(profileToAnalyze = profile) {
    setIsGenerating(true); setError("");
    try {
      const response = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profileToAnalyze) });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Your plan could not refresh right now.");
      }
      const result = (await response.json()) as { plan: CareerPlan };
      setPlan(result.plan);
      setNotice("notice" in result && result.notice ? String(result.notice) : result.plan.source === "demo" ? "Demo insights refreshed. Add an API key when you are ready for live analysis." : "AI analysis refreshed from your profile.");
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Your plan could not refresh right now."); }
    finally { setIsGenerating(false); }
  }

  function saveProfile(nextProfile: Profile) {
    setProfile(nextProfile); window.localStorage.setItem("careerpilot-profile", JSON.stringify(nextProfile)); setShowProfile(false); setMobileNavOpen(false); void generatePlan(nextProfile);
  }

  function toggleMilestone(title: string) {
    setCompletedMilestones((current) => {
      const next = current.includes(title) ? current.filter((item) => item !== title) : [...current, title];
      const total = plan.roadmap.reduce((count, phase) => count + phase.items.length, 0);
      setPlan((currentPlan) => ({ ...currentPlan, roadmapProgress: calculateRoadmapProgress(next.length, total, currentPlan.roadmapProgress) }));
      return next;
    });
  }

  function navigate(tab: Tab) { setActiveTab(tab); setMobileNavOpen(false); }

  return (
    <main className="app-shell">
      <aside className={mobileNavOpen ? "sidebar mobile-open" : "sidebar"}>
        <div className="brand"><span className="brand-mark"><Sparkles size={17} /></span><span>career<span className="brand-accent">pilot</span></span><button className="mobile-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={19} /></button></div>
        <div className="profile-mini"><div className="avatar">{profile.name.split(" ").map((part) => part[0]).join("")}</div><div><strong>{profile.name}</strong><span>{profile.status}</span></div><button aria-label="Edit profile" className="icon-button" onClick={() => setShowProfile(true)}><Pencil size={15} /></button></div>
        <nav className="main-nav" aria-label="Main navigation">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? "nav-item active" : "nav-item"} onClick={() => navigate(id)}><Icon size={17} /><span>{label}</span>{id === "resume" && <span className="nav-dot" />}</button>)}</nav>
        <div className="sidebar-bottom"><div className="weekly-card"><div className="weekly-top"><span>WEEKLY FOCUS</span><Target size={16} /></div><strong>Keep building momentum</strong><div className="mini-progress"><i style={{ width: "72%" }} /></div><small>3 of 4 goals complete</small></div><button className="settings-link"><CircleUserRound size={17} /> Account settings</button></div>
      </aside>
      {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <section className="content-area">
        <header className="topbar"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button><div className="breadcrumb"><span>My workspace</span><ChevronRight size={14} /><strong>{navItems.find((item) => item.id === activeTab)?.label}</strong></div><div className="top-actions"><span className="status-pill"><i /> {plan.source === "demo" ? "Demo plan · updated just now" : "Plan updated just now"}</span><button className="notification" aria-label="Notifications"><Bell size={19} /><i /></button><div className="top-avatar">{profile.name.split(" ").map((part) => part[0]).join("")}</div></div></header>
        <div className="page-content">
          <div className="welcome-row"><div><p className="eyebrow">THURSDAY, JUNE 12, 2025</p><h1>Your next chapter, <em>mapped.</em></h1><p className="lede">A clearer path from where you are to where you want to go.</p></div><button className="primary-button" onClick={() => void generatePlan()} disabled={isGenerating}>{isGenerating ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}{isGenerating ? "Thinking..." : "Refresh my plan"}</button></div>
          {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => void generatePlan()}>Retry <ArrowUpRight size={14} /></button></div>}
          {notice && !error && <div className="notice-banner" role="status"><Sparkles size={14} /><span>{notice}</span><button aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={14} /></button></div>}
          {activeTab === "overview" && <Overview plan={plan} setActiveTab={navigate} setSelectedPath={setSelectedPath} />}
          {activeTab === "paths" && <Paths plan={plan} setSelectedPath={setSelectedPath} />}
          {activeTab === "roadmap" && <Roadmap plan={plan} completedMilestones={completedMilestones} onToggle={toggleMilestone} />}
          {activeTab === "projects" && <Projects plan={plan} />}
          {activeTab === "resume" && <Resume plan={plan} profile={profile} />}
        </div>
      </section>
      {showProfile && <ProfileDialog profile={profile} onClose={() => setShowProfile(false)} onSave={saveProfile} />}
      {selectedPath && <PathDialog path={selectedPath} onClose={() => setSelectedPath(null)} />}
    </main>
  );
}

function PanelHeading({ label, title, action, onClick }: { label: string; title: string; action?: string; onClick?: () => void }) { return <div className="panel-heading"><div><p className="eyebrow">{label}</p><h3>{title}</h3></div>{action && <button className="small-action" onClick={onClick}>{action} <ArrowUpRight size={14} /></button>}</div>; }

function Overview({ plan, setActiveTab, setSelectedPath }: { plan: CareerPlan; setActiveTab: (tab: Tab) => void; setSelectedPath: (path: CareerPath) => void }) {
  const topPath = plan.paths[0];
  return <div className="dashboard-grid"><section className="hero-card"><div className="hero-card-copy"><div className="section-kicker"><span className="sparkle-badge"><Sparkles size={15} /></span> CAREERPILOT INSIGHT</div><h2>You&apos;re closer than<br /><span>you think.</span></h2><p>{topPath.explanation} Your next move is to make that story visible.</p><button className="text-button" onClick={() => setActiveTab("paths")}>Explore your top matches <ArrowUpRight size={16} /></button></div><div className="orbit-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><Sparkles size={21} /></div><span className="orbit-label label-one">curiosity</span><span className="orbit-label label-two">strategy</span><span className="orbit-label label-three">empathy</span></div></section><section className="stat-row"><Stat icon={<Gauge size={18} />} tone="coral-bg" label="PROFILE STRENGTH" value={`${plan.profileStrength}`} suffix="/100" note="Top 18% of explorers" /><Stat icon={<Target size={18} />} tone="mint-bg" label="TOP CAREER MATCH" value={`${plan.topMatch}`} suffix="%" note={topPath.title} /><Stat icon={<GraduationCap size={18} />} tone="gold-bg" label="ROADMAP PROGRESS" value={`${plan.roadmapProgress}`} suffix="%" note="3 milestones this month" /></section><section className="panel skills-panel"><PanelHeading label="SKILL GAP ANALYSIS" title="Your edge, at a glance" action="See full analysis" onClick={() => setActiveTab("paths")} /><div className="skill-list">{plan.skills.map((skill) => <div className="skill-line" key={skill.name}><div className="skill-name"><span>{skill.name}</span><b>{skill.current}% <small>/ {skill.target}%</small></b></div><div className="progress-track"><i className={skill.tone} style={{ width: `${skill.current}%` }} /></div><div className="skill-meta"><span className={`priority ${skill.priority.toLowerCase()}`}>{skill.priority} priority</span><span>{Math.max(skill.target - skill.current, 0)} point gap</span></div></div>)}</div></section></div>; }

function Stat({ icon, tone, label, value, suffix, note }: { icon: React.ReactNode; tone: string; label: string; value: string; suffix: string; note: string }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span>{label}</span><strong>{value}<small>{suffix}</small></strong><p>{note}</p></div>; }

function Paths({ plan, setSelectedPath }: { plan: CareerPlan; setSelectedPath: (path: CareerPath) => void }) { return <div className="inner-view"><div className="view-intro"><div><p className="eyebrow">AI CAREER MATCHING</p><h2>Paths with your fingerprints on them.</h2><p>Based on your strengths, experience, and the kind of problems you want to solve.</p></div><div className="match-summary"><Sparkles size={17} /><strong>{plan.paths.length} paths</strong><span>worth your attention</span></div></div><div className="path-cards">{plan.paths.map((path, index) => <article className={`path-card ${path.color}`} key={path.title}><div className="path-card-top"><span className="match-badge">{path.match}% MATCH</span><span className="path-index">0{index + 1}</span></div><h3>{path.title}</h3><p>{path.explanation}</p><div className="path-details"><div><span>YOUR STRENGTHS</span><p>{path.strengths.join(" · ")}</p></div><div><span>BUILD NEXT</span><p>{path.missingSkills.join(" · ")}</p></div></div><div className="path-card-footer"><span>Typical salary <strong>{path.salary}</strong></span><button className="circle-arrow" aria-label={`Explore ${path.title}`} onClick={() => setSelectedPath(path)}><ArrowUpRight size={17} /></button></div></article>)}</div></div>; }

function Roadmap({ plan, completedMilestones, onToggle }: { plan: CareerPlan; completedMilestones: string[]; onToggle: (title: string) => void }) { const total = plan.roadmap.reduce((count, phase) => count + phase.items.length, 0); const completed = completedMilestones.length; const progress = completed ? calculateRoadmapProgress(completed, total) : plan.roadmapProgress; return <div className="inner-view"><div className="view-intro"><div><p className="eyebrow">YOUR 90-DAY PLAN</p><h2>A roadmap that respects your life.</h2><p>Small, deliberate steps designed around 4 hours a week.</p></div><span className="plan-chip"><Check size={14} /> {progress}% complete</span></div><div className="roadmap-list"><div className="roadmap-summary"><strong>{completed} of {total} milestones complete</strong><span>{total - completed} remaining</span></div>{plan.roadmap.map((phase) => <section className="roadmap-phase" key={phase.range}><div className="phase-heading"><span className="roadmap-month">{phase.range}</span><h3>{phase.title}</h3><p>{phase.theme}</p></div>{phase.items.map((item) => { const isComplete = completedMilestones.includes(item.title); return <article className={`roadmap-item ${item.status} ${isComplete ? "complete" : ""}`} key={item.title}><div className="roadmap-marker">{isComplete ? <Check size={15} /> : item.status === "active" ? <span /> : item.status === "next" ? <ChevronRight size={15} /> : "•"}</div><div className="roadmap-copy"><span className="roadmap-month">{item.effort}</span><h3>{item.title}</h3><p>{item.detail}</p><div className="tag-row">{item.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><small className="roadmap-outcome"><Check size={13} /> {item.outcome}</small><button className={isComplete ? "milestone-button complete" : "milestone-button"} onClick={() => onToggle(item.title)}>{isComplete ? <><Check size={13} /> Completed</> : <><Target size={13} /> Mark complete</>}</button></div></article>; })}</section>)}</div></div>; }

function Projects({ plan }: { plan: CareerPlan }) { return <div className="inner-view"><div className="view-intro"><div><p className="eyebrow">PROOF OF WORK</p><h2>Projects that make your story tangible.</h2><p>Build these to turn your next interview into a conversation about what you can do.</p></div><button className="outline-button"><Plus size={16} /> Suggest a project</button></div><div className="project-grid">{plan.projects.map((project, index) => <article className={`project-card ${index === 0 ? "featured" : ""}`} key={project.name}><span className="project-type">{project.type}</span><h3>{project.name}</h3><p>{project.outcome}</p><div className="project-details"><div><span>SKILLS PRACTICED</span><p>{project.skills.join(" · ")}</p></div><div><span>STACK</span><p>{project.stack.join(" · ")}</p></div></div><div className="project-footer"><span>{project.difficulty}</span><span>{project.value}</span><ArrowUpRight size={17} /></div></article>)}</div></div>; }

function Resume({ profile }: { plan: CareerPlan; profile: Profile }) {
  const [resumeText, setResumeText] = useState(profile.resumeText ?? "");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  async function runAnalysis() {
    if (resumeText.trim().length < 80) {
      setError("Add at least 80 characters so the analysis has useful context.");
      return;
    }
    setIsAnalyzing(true);
    setError("");
    try {
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, targetCareer: profile.targetCareer, profile }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "We couldn't analyze your resume.");
      }
      const result = (await response.json()) as { analysis: ResumeAnalysis; notice?: string };
      setAnalysis(result.analysis);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't analyze your resume.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="inner-view">
      <div className="view-intro">
        <div>
          <p className="eyebrow">RESUME COACH</p>
          <h2>Make your experience impossible to miss.</h2>
          <p>Paste your resume to get feedback grounded in your actual experience.</p>
        </div>
        <button className="primary-button" disabled={isAnalyzing || resumeText.trim().length < 80} onClick={() => void runAnalysis()}>
          {isAnalyzing ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
          {isAnalyzing ? "Analyzing..." : analysis ? "Re-analyze resume" : "Analyze resume"}
        </button>
      </div>
      {!analysis ? (
        <section className="resume-empty">
          <FileText size={24} />
          <h3>Your resume is the missing signal.</h3>
          <p>CareerPilot will only show feedback after you provide source material. Minimum 80 characters.</p>
          <textarea
            aria-label="Resume text"
            value={resumeText}
            onChange={(event) => setResumeText(event.currentTarget.value)}
            placeholder="Paste your resume here..."
            rows={12}
            className="resume-textarea"
          />
          <small className="character-count">
            {resumeText.length} characters {resumeText.trim().length < 80 && `· ${80 - resumeText.trim().length} more needed`}
          </small>
          {error && <p className="field-error" role="alert">{error}</p>}
        </section>
      ) : (
        <ResumeResults analysis={analysis} onRetry={() => void runAnalysis()} isAnalyzing={isAnalyzing} />
      )}
    </div>
  );
}

function ResumeResults({ analysis, onRetry, isAnalyzing }: { analysis: ResumeAnalysis; onRetry: () => void; isAnalyzing: boolean }) {
  return (
    <div className="resume-results">
      <div className="analysis-banner" role="status">
        <Sparkles size={15} />
        <span>{analysis.source === "demo" ? "Demo resume feedback · no provider key configured" : "Provider-generated resume analysis"}</span>
        <button onClick={onRetry} disabled={isAnalyzing}>
          {isAnalyzing ? "Analyzing..." : "Run again"}
        </button>
      </div>

      <div className="score-cards">
        <article className="score-card">
          <span className="score-label">OVERALL</span>
          <div className="score-value">{analysis.overallScore}</div>
          <span className="score-max">/100</span>
        </article>
        <article className="score-card">
          <span className="score-label">ATS SCORE</span>
          <div className="score-value">{analysis.atsScore}</div>
          <span className="score-max">/100</span>
        </article>
        <article className="score-card">
          <span className="score-label">INTERVIEW READY</span>
          <div className="score-value">{analysis.interviewReadiness}</div>
          <span className="score-max">/100</span>
        </article>
      </div>

      <div className="resume-summary">
        <h3>Your resume analysis</h3>
        <p>{analysis.summary}</p>
      </div>

      <div className="resume-sections">
        <div className="resume-section">
          <span className="section-header">STRENGTHS</span>
          {analysis.strengths.map((item) => (
            <p key={item}>
              <Check size={13} /> {item}
            </p>
          ))}
        </div>
        <div className="resume-section">
          <span className="section-header">AREAS TO IMPROVE</span>
          {analysis.weaknesses.map((item) => (
            <p key={item}>
              <Target size={13} /> {item}
            </p>
          ))}
        </div>
      </div>

      <div className="resume-keywords">
        <span className="section-header">MISSING KEYWORDS</span>
        <div className="tag-row">
          {analysis.keywordSuggestions.map((keyword) => (
            <span key={keyword}>{keyword}</span>
          ))}
        </div>
      </div>

      <div className="resume-missing-skills">
        <span className="section-header">SKILLS TO EMPHASIZE</span>
        {analysis.missingSkills.map((skill) => (
          <p key={skill}>
            <Lightbulb size={13} /> {skill}
          </p>
        ))}
      </div>

      <article className="experience-suggestions">
        <span className="section-header">BULLET POINT EXAMPLES</span>
        {analysis.experienceSuggestions.map((suggestion, index) => (
          <p key={index}>
            <Check size={13} /> {suggestion}
          </p>
        ))}
      </article>

      <article className="action-items">
        <span className="section-header">NEXT ACTIONS</span>
        <ol>
          {analysis.actionItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ol>
      </article>
    </div>
  );
}

function Dialog({ children, title, label, onClose }: { children: React.ReactNode; title: string; label: string; onClose: () => void }) { return <div className="modal-backdrop" onClick={onClose}><section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow">{label}</p><h2 id="dialog-title">{title}</h2></div><button className="close-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>{children}</section></div>; }

function ProfileDialog({ profile, onClose, onSave }: { profile: Profile; onClose: () => void; onSave: (profile: Profile) => void }) { const [draft, setDraft] = useState(profile); const [validation, setValidation] = useState(""); const fields: [keyof Profile, string][] = [["name", "Name"], ["status", "Current status"], ["targetCareer", "Target career"], ["experience", "Experience"], ["education", "Education"], ["skills", "Skills & strengths"], ["interests", "Interests"], ["learningGoals", "Learning goals"]]; function submit() { if (!draft.name.trim() || !draft.targetCareer.trim()) { setValidation("Name and target career are required."); return; } onSave(draft); } return <Dialog label="PROFILE SIGNALS" title="Make your plan more you." onClose={onClose}><p className="modal-copy">CareerPilot uses these details to tune your recommendations. Your profile is saved only in this browser for the demo.</p><div className="profile-fields">{fields.map(([key, label]) => <label className="field" key={key}>{label}{(key === "name" || key === "targetCareer") && <span className="required">required</span>}<input required={key === "name" || key === "targetCareer"} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}</div>{validation && <p className="field-error" role="alert">{validation}</p>}<button className="primary-button full-button" onClick={submit}><Check size={17} /> Save profile</button></Dialog>; }

function PathDialog({ path, onClose }: { path: CareerPath; onClose: () => void }) { return <Dialog label="CAREER PATH DETAIL" title={path.title} onClose={onClose}><div className="detail-score"><strong>{path.match}%</strong><span>match based on your profile</span></div><p className="modal-copy">{path.explanation}</p><div className="detail-columns"><div><span>WHY IT MATCHES</span>{path.strengths.map((item) => <p key={item}><Check size={13} /> {item}</p>)}</div><div><span>SKILLS TO BUILD</span>{path.missingSkills.map((item) => <p key={item}><Target size={13} /> {item}</p>)}</div></div><div className="next-step"><span>NEXT BEST STEP</span><strong>{path.nextStep}</strong></div></Dialog>; }
