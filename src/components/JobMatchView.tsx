// F.R.I.D.A.Y - Job Match & Hard Gate Eligibility Inspector (PRD v3.0 / v4.0 compliant)
import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  XCircle,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Search,
  Lock,
  Layers,
  FileCheck
} from 'lucide-react';
import type {
  CandidateProfile,
  EvidenceFact,
  JobPosting,
  MatchEvaluation
} from '../types';
import { sanitizeJobDescription } from '../services/security';
import { evaluateMatch } from '../services/matching';

interface JobMatchViewProps {
  profile: CandidateProfile | null;
  facts: EvidenceFact[];
  jobs: JobPosting[];
  activeJob: JobPosting | null;
  setActiveJob: (job: JobPosting) => void;
  onSaveJob: (job: JobPosting) => Promise<void>;
  onProceedToTailoring: (job: JobPosting) => void;
}

export const JobMatchView: React.FC<JobMatchViewProps> = ({
  profile,
  facts,
  jobs,
  activeJob,
  setActiveJob,
  onSaveJob,
  onProceedToTailoring
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [inputCompany, setInputCompany] = useState('');
  const [inputLocation, setInputLocation] = useState('Remote / Flexible');
  const [inputWorkModel, setInputWorkModel] = useState<'remote' | 'hybrid' | 'onsite'>('remote');
  const [inputUrl, setInputUrl] = useState('');
  const [inputSalary, setInputSalary] = useState('');
  const [inputSource, setInputSource] = useState<JobPosting['source']>('user_clip');
  const [inputRawJd, setInputRawJd] = useState('');

  // Current evaluation for the active job
  const evaluation: MatchEvaluation | null = (profile && activeJob)
    ? evaluateMatch(profile, facts, activeJob)
    : null;

  const handleCreateAndEvaluateJob = async () => {
    if (!inputTitle.trim() || !inputCompany.trim() || !inputRawJd.trim()) return;

    // Run Pre-Eval Security Scan (ai-job-search benchmark)
    const scanResult = sanitizeJobDescription(inputRawJd);

    const newJob: JobPosting = {
      id: `job-${Date.now()}`,
      title: inputTitle.trim(),
      company: inputCompany.trim(),
      location: inputLocation.trim(),
      workModel: inputWorkModel,
      source: inputSource,
      sourceUrl: inputUrl.trim() || undefined,
      salaryText: inputSalary.trim() || undefined,
      rawDescription: inputRawJd,
      sanitizedDescription: scanResult.sanitizedText,
      capturedAt: new Date().toISOString(),
      freshnessStatus: 'CURRENT_CONFIRMED',
      extractedRequirements: [],
      integrityFlags: {
        ghostJobRisk: scanResult.ghostJobFlags.length > 0,
        promptInjectionDetected: scanResult.promptInjectionDetected,
        hiddenTextFound: scanResult.hiddenCharactersRemoved > 0,
        notes: scanResult.ghostJobFlags
      }
    };

    await onSaveJob(newJob);
    setActiveJob(newJob);
    setIsAddingNew(false);
    setInputTitle('');
    setInputCompany('');
    setInputRawJd('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-indigo-950/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-indigo-400 text-xs font-mono font-medium mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Two-Stage Hard Gate & 4-Pillar Evaluation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Job Match & Hard Gate Inspector
            </h1>
            <p className="text-slate-400 text-sm mt-1.5">
              Separates mandatory eligibility gates (Pass / Fail / Unknown) from fit estimates. Unknown gates are never averaged away.
            </p>
          </div>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition shadow-lg shadow-cyan-600/20 shrink-0 self-start sm:self-auto"
          >
            <Search className="w-4 h-4" />
            <span>{isAddingNew ? 'Cancel New Job' : 'Add / Paste Job Posting'}</span>
          </button>
        </div>
      </div>

      {/* New Job Form */}
      {isAddingNew && (
        <div className="glass-card p-6 rounded-2xl border border-cyan-800/60 bg-slate-900/90 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Paste Untrusted Job Posting (Scanned & Sanitized Client-Side)</span>
            </h3>
            <span className="text-[11px] font-mono text-cyan-400">Pre-Eval Security Guardrail Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Job Title *</label>
              <input
                type="text"
                placeholder="e.g. Senior Registered Nurse or Cloud DevOps Engineer"
                value={inputTitle}
                onChange={e => setInputTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hiring Organization / Company *</label>
              <input
                type="text"
                placeholder="e.g. St. Jude Healthcare or Stripe"
                value={inputCompany}
                onChange={e => setInputCompany(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Source Connector</label>
              <select
                value={inputSource}
                onChange={e => setInputSource(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              >
                <option value="user_clip">Bring-Your-Own-Tab (User Clip)</option>
                <option value="greenhouse">Greenhouse ATS Board</option>
                <option value="lever">Lever Postings API</option>
                <option value="ashby">Ashby Job Board</option>
                <option value="manual">Manual Paste / Employer Site</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Model</label>
              <select
                value={inputWorkModel}
                onChange={e => setInputWorkModel(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="remote">Fully Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-Site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. New York, NY or Anywhere (US)"
                value={inputLocation}
                onChange={e => setInputLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Posting URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Raw Job Description Text *
            </label>
            <textarea
              rows={7}
              placeholder="Paste complete job description text here..."
              value={inputRawJd}
              onChange={e => setInputRawJd(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAndEvaluateJob}
              disabled={!inputTitle.trim() || !inputCompany.trim() || !inputRawJd.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition shadow-lg shadow-cyan-600/20"
            >
              Run Security Scan & Evaluate Fit
            </button>
          </div>
        </div>
      )}

      {/* Saved Jobs Selector Tabs */}
      {jobs.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {jobs.map(j => (
            <button
              key={j.id}
              onClick={() => setActiveJob(j)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                activeJob?.id === j.id
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="font-semibold">{j.title}</span>
              <span className="text-[11px] text-slate-500">@{j.company}</span>
            </button>
          ))}
        </div>
      )}

      {/* Active Job Inspector */}
      {activeJob && evaluation ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Job Details & Security Scan Report */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 lg:col-span-1 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {activeJob.source}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Sanitized</span>
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-2">{activeJob.title}</h2>
              <p className="text-sm text-cyan-400 font-medium">{activeJob.company}</p>
              <p className="text-xs text-slate-400 mt-1">{activeJob.location} • {activeJob.workModel}</p>
              {activeJob.salaryText && (
                <p className="text-xs text-emerald-400 font-mono mt-1">{activeJob.salaryText}</p>
              )}
            </div>

            {/* Security Guardrail Report */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pre-Eval Security Diagnostics</span>
              </h4>
              <ul className="text-[11px] space-y-1 text-slate-400">
                <li className="flex items-center justify-between">
                  <span>Prompt Injection Threat:</span>
                  <span className={activeJob.integrityFlags.promptInjectionDetected ? 'text-rose-400 font-bold' : 'text-emerald-400 font-mono'}>
                    {activeJob.integrityFlags.promptInjectionDetected ? 'DETECTED & STRIPPED' : 'CLEAN'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Zero-Width Unicode Characters:</span>
                  <span className="text-emerald-400 font-mono">
                    {activeJob.integrityFlags.hiddenTextFound ? 'REMOVED' : 'NONE'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Ghost-Job / Scam Indicators:</span>
                  <span className={activeJob.integrityFlags.ghostJobRisk ? 'text-amber-400 font-bold' : 'text-emerald-400 font-mono'}>
                    {activeJob.integrityFlags.ghostJobRisk ? 'FLAGGED' : 'LOW RISK'}
                  </span>
                </li>
              </ul>
              {activeJob.integrityFlags.notes && activeJob.integrityFlags.notes.length > 0 && (
                <div className="mt-2 p-2 rounded bg-amber-950/40 border border-amber-900/50 text-amber-300 text-[10px]">
                  {activeJob.integrityFlags.notes.join(' ')}
                </div>
              )}
            </div>

            {/* Job Description Excerpt */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-1.5">Sanitized JD Excerpt</h4>
              <div className="max-h-48 overflow-y-auto p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 font-mono leading-relaxed">
                {activeJob.sanitizedDescription}
              </div>
            </div>

            {/* CTA to Tailor */}
            <button
              onClick={() => onProceedToTailoring(activeJob)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/25"
            >
              <span>Tailor Application & Fact Gate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right 2 Columns: Hard Gates & 4-Pillar Fit Breakdown */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-6">
            {/* Top Score Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/30 border border-slate-800">
              <div className="flex items-center gap-4">
                {/* Radial Gauge */}
                <div className="relative w-20 h-20 flex items-center justify-center rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-inner">
                  <span className="text-2xl font-black font-mono text-cyan-300">
                    {evaluation.fitEstimate}%
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">Fit Estimate</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {evaluation.confidence} CONFIDENCE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Calculated using 4-Pillar algorithm (Skills 40%, Experience 25%, Prefs 20%, Evidence 15%).
                  </p>
                </div>
              </div>

              {/* Eligibility State Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Gate State:</span>
                <span
                  className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                    evaluation.eligibility === 'PASS'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : evaluation.eligibility === 'FAIL'
                      ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                      : 'bg-amber-950/80 text-amber-400 border-amber-800'
                  }`}
                >
                  {evaluation.eligibility === 'PASS' && <CheckCircle className="w-3.5 h-3.5" />}
                  {evaluation.eligibility === 'FAIL' && <XCircle className="w-3.5 h-3.5" />}
                  {evaluation.eligibility === 'REVIEW' && <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{evaluation.eligibility}</span>
                </span>
              </div>
            </div>

            {/* Hard Gates Section (PRD v3.0 FR-041) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Mandatory Hard Gates (Licensure, Work Auth, Clearance)</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">Independent of Fit Score</span>
              </div>

              {evaluation.hardGates.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  No strict hard gate keywords detected in this job description.
                </p>
              ) : (
                <div className="space-y-2">
                  {evaluation.hardGates.map(gate => (
                    <div
                      key={gate.id}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                        gate.status === 'PASS'
                          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                          : gate.status === 'FAIL'
                          ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                          : 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-200">
                            {gate.gateType}
                          </span>
                          <span className="font-semibold text-xs">
                            {gate.requirementText}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          {gate.reason}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-1 rounded font-bold shrink-0 ${
                          gate.status === 'PASS'
                            ? 'bg-emerald-900/80 text-emerald-200'
                            : gate.status === 'FAIL'
                            ? 'bg-rose-900/80 text-rose-200'
                            : 'bg-amber-900/80 text-amber-200'
                        }`}
                      >
                        {gate.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4-Pillar Subscore Progress Bars */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white">4-Pillar Evaluation Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">1. Skill Coverage (40%)</span>
                    <span className="font-mono text-cyan-400">{evaluation.subscores.skills}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${evaluation.subscores.skills}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">2. Experience Alignment (25%)</span>
                    <span className="font-mono text-cyan-400">{evaluation.subscores.experience}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-teal-400 rounded-full"
                      style={{ width: `${evaluation.subscores.experience}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">3. Preference Alignment (20%)</span>
                    <span className="font-mono text-cyan-400">{evaluation.subscores.preferences}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${evaluation.subscores.preferences}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">4. Evidence Strength (15%)</span>
                    <span className="font-mono text-cyan-400">{evaluation.subscores.evidence}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${evaluation.subscores.evidence}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Matched vs Missing Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <h5 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Matched Skills ({evaluation.matchedSkills.length})</span>
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {evaluation.matchedSkills.length === 0 ? (
                    <span className="text-[11px] text-slate-500">None detected</span>
                  ) : (
                    evaluation.matchedSkills.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 text-[11px] font-mono">
                        {s}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Missing / Unexpressed Skills ({evaluation.missingSkills.length})</span>
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {evaluation.missingSkills.length === 0 ? (
                    <span className="text-[11px] text-slate-500">None detected</span>
                  ) : (
                    evaluation.missingSkills.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/60 text-[11px] font-mono">
                        {s}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Skill Gap Bridging Recommendations (Free resources first) */}
            {evaluation.gapRecommendations.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Qualification Gap Bridging (Free Resources First)</span>
                </h5>
                <div className="space-y-2">
                  {evaluation.gapRecommendations.map(gap => (
                    <div key={gap.skill} className="flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-cyan-300 uppercase font-mono">{gap.skill}: </span>
                        <span className="text-slate-300">{gap.action}</span>
                      </div>
                      {gap.freeResourceUrl && (
                        <a
                          href={gap.freeResourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium shrink-0"
                        >
                          <span>Free Study Guide</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 glass-card rounded-2xl border border-slate-800 text-slate-400">
          <p className="text-sm">Select or add a job posting above to inspect hard gates and fit estimate.</p>
        </div>
      )}
    </div>
  );
};
