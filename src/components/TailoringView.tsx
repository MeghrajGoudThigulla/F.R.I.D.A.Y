// F.R.I.D.A.Y - Tailoring Studio & Deterministic Fact Gate Reviewer
import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Download,
  Copy,
  Check,
  Send,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Lock,
  MessageSquare,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import type {
  CandidateProfile,
  EvidenceFact,
  JobPosting,
  TailoredDocument,
  AISettings,
  BulletPointDraft
} from '../types';
import { generateTailoredDeliverables } from '../services/ai';
import { evaluateSentenceAgainstFacts } from '../services/security';
import {
  generateAtsPdf,
  generateAtsDocxBlob,
  downloadPdf,
  downloadBlob
} from '../services/export';

interface TailoringViewProps {
  profile: CandidateProfile | null;
  facts: EvidenceFact[];
  activeJob: JobPosting | null;
  settings: AISettings;
  tailoredDoc: TailoredDocument | null;
  onSaveTailoredDoc: (doc: TailoredDocument) => Promise<void>;
  onMarkAsApplied: (job: JobPosting, doc: TailoredDocument) => Promise<void>;
}

export const TailoringView: React.FC<TailoringViewProps> = ({
  profile,
  facts,
  activeJob,
  settings,
  tailoredDoc,
  onSaveTailoredDoc,
  onMarkAsApplied
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'coverLetter' | 'outreach' | 'interview'>('resume');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingBulletId, setEditingBulletId] = useState<string | null>(null);
  const [editedBulletText, setEditedBulletText] = useState('');
  const [exportWarning, setExportWarning] = useState<string | null>(null);

  const confirmedFacts = facts.filter(f => f.reviewState === 'CONFIRMED' || f.reviewState === 'CORRECTED');

  const handleGenerate = async () => {
    if (!profile || !activeJob) return;
    setIsGenerating(true);
    setExportWarning(null);
    try {
      const generated = await generateTailoredDeliverables(profile, confirmedFacts, activeJob, settings);
      await onSaveTailoredDoc(generated);
    } catch (err: any) {
      alert(`Generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveBulletEdit = async (bullet: BulletPointDraft) => {
    if (!tailoredDoc || !editedBulletText.trim()) return;

    const check = evaluateSentenceAgainstFacts(editedBulletText.trim(), confirmedFacts);
    const updatedBullets = tailoredDoc.tailoredBullets.map(b => {
      if (b.id === bullet.id) {
        return {
          ...b,
          draft: editedBulletText.trim(),
          reviewStatus: check.status,
          justification: check.justification,
          flaggedEntities: check.flaggedEntities
        };
      }
      return b;
    });

    const isFactGatePassed = !updatedBullets.some(b => b.reviewStatus === 'BLOCKED');

    await onSaveTailoredDoc({
      ...tailoredDoc,
      tailoredBullets: updatedBullets,
      isFactGatePassed
    });

    setEditingBulletId(null);
  };

  const handleExportPdf = () => {
    if (!profile || !tailoredDoc) return;
    if (!tailoredDoc.isFactGatePassed) {
      setExportWarning('Export blocked by Fact Gate: Document contains unverified claims or metrics. Edit or remove blocked items to proceed.');
      return;
    }

    const { doc, verification } = generateAtsPdf(profile, tailoredDoc);
    if (!verification.isWithinPageLimits) {
      setExportWarning(`Warning: ${verification.warnings.join(' ')}`);
    } else {
      setExportWarning(null);
    }
    const filename = `${profile.name.replace(/\s+/g, '_')}_${tailoredDoc.company.replace(/\s+/g, '_')}_ATS_Resume.pdf`;
    downloadPdf(doc, filename);
  };

  const handleExportDocx = async () => {
    if (!profile || !tailoredDoc) return;
    if (!tailoredDoc.isFactGatePassed) {
      setExportWarning('Export blocked by Fact Gate: Document contains unverified claims or metrics. Edit or remove blocked items to proceed.');
      return;
    }

    try {
      const blob = await generateAtsDocxBlob(profile, tailoredDoc);
      const filename = `${profile.name.replace(/\s+/g, '_')}_${tailoredDoc.company.replace(/\s+/g, '_')}_Resume.docx`;
      downloadBlob(blob, filename);
    } catch (err: any) {
      alert(`DOCX export failed: ${err.message}`);
    }
  };

  if (!activeJob) {
    return (
      <div className="text-center py-20 glass-card rounded-2xl border border-slate-800 text-slate-400 max-w-xl mx-auto">
        <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-base font-semibold text-slate-300">No Job Selected</p>
        <p className="text-xs text-slate-500 mt-1">Please select or add a target job posting in the Job Matcher tab first.</p>
      </div>
    );
  }

  const hasBlockedBullets = tailoredDoc?.tailoredBullets.some(b => b.reviewStatus === 'BLOCKED');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-teal-950/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/70 border border-teal-800/60 text-teal-400 text-xs font-mono font-medium mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Drafter-Reviewer & Closed-Loop ATS Exporter</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tailoring Studio & Fact Gate
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Target: <strong className="text-white">{activeJob.title}</strong> at <strong className="text-cyan-300">{activeJob.company}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-teal-600/25 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing Draft...' : tailoredDoc ? 'Regenerate Draft' : 'Generate Tailored Pack'}</span>
            </button>
          </div>
        </div>

        {/* Fact Gate Status Warning */}
        {hasBlockedBullets && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Fact Gate Block:</strong> One or more drafted claims contain metrics, dates, or titles not verified in your evidence ledger. PDF/DOCX export is blocked until corrected.
              </span>
            </div>
          </div>
        )}

        {exportWarning && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{exportWarning}</span>
          </div>
        )}
      </div>

      {tailoredDoc ? (
        <div className="space-y-6">
          {/* Sub-Tabs: Resume Bullets | Cover Letter | Outreach Note | STAR Interview */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('resume')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'resume'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tailored Resume Content</span>
            </button>

            <button
              onClick={() => setActiveTab('coverLetter')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'coverLetter'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tailored Cover Letter</span>
            </button>

            <button
              onClick={() => setActiveTab('outreach')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'outreach'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Recruiter Note / SMS Script</span>
            </button>

            <button
              onClick={() => setActiveTab('interview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'interview'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>STAR Interview Prep ({tailoredDoc.interviewPrep.length})</span>
            </button>
          </div>

          {/* TAB 1: Tailored Resume Content */}
          {activeTab === 'resume' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Cols: Headline, Summary & Bullets */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Targeted Headline
                  </h3>
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm font-semibold text-white font-mono">
                    {tailoredDoc.tailoredHeadline}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Tailored Professional Summary
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                    {tailoredDoc.tailoredSummary}
                  </div>
                </div>

                {/* Evidence-Grounded Bullets with Fact Gate Badges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Grounded Bullet Points ({tailoredDoc.tailoredBullets.length})
                    </h3>
                    <span className="text-[11px] font-mono text-cyan-400">
                      Deterministic Fact Gate Active
                    </span>
                  </div>

                  <div className="space-y-3">
                    {tailoredDoc.tailoredBullets.map((bullet, idx) => (
                      <div
                        key={bullet.id}
                        className={`p-4 rounded-xl border transition-all ${
                          bullet.reviewStatus === 'SUPPORTED'
                            ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40'
                            : bullet.reviewStatus === 'BLOCKED'
                            ? 'bg-rose-950/30 border-rose-800/80 shadow-sm shadow-rose-950/50'
                            : 'bg-amber-950/30 border-amber-800/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                Point #{idx + 1}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                                  bullet.reviewStatus === 'SUPPORTED'
                                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                    : bullet.reviewStatus === 'BLOCKED'
                                    ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                                    : 'bg-amber-950 text-amber-300 border-amber-800'
                                }`}
                              >
                                {bullet.reviewStatus}
                              </span>
                            </div>

                            {editingBulletId === bullet.id ? (
                              <div className="space-y-2 mt-2">
                                <textarea
                                  rows={3}
                                  value={editedBulletText}
                                  onChange={e => setEditedBulletText(e.target.value)}
                                  className="w-full bg-slate-950 border border-cyan-500 rounded-lg p-2.5 text-xs text-white"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveBulletEdit(bullet)}
                                    className="px-3 py-1 rounded bg-cyan-600 text-white text-xs font-semibold"
                                  >
                                    Save & Re-Check Gate
                                  </button>
                                  <button
                                    onClick={() => setEditingBulletId(null)}
                                    className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-100 text-xs font-medium leading-relaxed">
                                • {bullet.draft}
                              </p>
                            )}

                            {/* Fact Gate Justification */}
                            <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/70 p-2 rounded border border-slate-800">
                              <span className="text-slate-500 font-mono">Fact Gate: </span>
                              {bullet.justification}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setEditingBulletId(bullet.id);
                              setEditedBulletText(bullet.draft);
                            }}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition shrink-0"
                            title="Edit Bullet"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Col: Export & CRM Actions */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 lg:col-span-1 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Closed-Loop ATS Export</h3>
                  <p className="text-xs text-slate-400">
                    Complies with single-column ATS reading order, verified plain-text layer, and federal USAJobs 2-page limits.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleExportPdf}
                    disabled={hasBlockedBullets}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download ATS Single-Column PDF</span>
                  </button>

                  <button
                    onClick={handleExportDocx}
                    disabled={hasBlockedBullets}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Editable DOCX (Word)</span>
                  </button>

                  <button
                    onClick={() => onMarkAsApplied(activeJob, tailoredDoc)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>Mark as Applied & Send to CRM</span>
                  </button>
                </div>

                {/* ATS Compliance Checklist Box */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <h4 className="font-semibold text-slate-200">ATS Verification Matrix:</h4>
                  <ul className="space-y-1.5 text-slate-400 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Single-column linear text flow</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>No tables/textboxes that scramble OCR</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>USAJobs federal template limits checked</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Zero hallucinated ungrounded metrics</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Cover Letter */}
          {activeTab === 'coverLetter' && (
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Truthful Evidence-Linked Cover Letter</h3>
                <button
                  onClick={() => handleCopy(tailoredDoc.coverLetter, 'cl')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition"
                >
                  {copiedKey === 'cl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'cl' ? 'Copied to Clipboard' : 'Copy Letter'}</span>
                </button>
              </div>

              <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                {tailoredDoc.coverLetter}
              </div>
            </div>
          )}

          {/* TAB 3: Outreach Pitch / WhatsApp Script */}
          {activeTab === 'outreach' && (
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">300-Char Recruiter Pitch & WhatsApp Script</h3>
                  <p className="text-xs text-slate-400">Perfect for cold LinkedIn InMail, email outreach, or WhatsApp/SMS hiring channels.</p>
                </div>
                <button
                  onClick={() => handleCopy(tailoredDoc.outreachPitch, 'pitch')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition"
                >
                  {copiedKey === 'pitch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'pitch' ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm font-medium text-cyan-300 font-mono">
                "{tailoredDoc.outreachPitch}"
              </div>
            </div>
          )}

          {/* TAB 4: STAR Interview Prep */}
          {activeTab === 'interview' && (
            <div className="space-y-4">
              <div className="glass-card p-6 rounded-2xl border border-slate-800">
                <h3 className="text-base font-bold text-white">STAR Behavioral & Technical Interview Simulator</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Structured talking points derived from your actual career evidence facts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tailoredDoc.interviewPrep.map((sq, i) => (
                  <div key={sq.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {sq.targetSkillOrCompetency}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">Q#{i + 1}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">
                      "{sq.question}"
                    </h4>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="p-2 rounded bg-slate-950/70">
                        <strong className="text-cyan-400 font-mono">Situation: </strong>
                        <span className="text-slate-300">{sq.talkingPoints.situation}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/70">
                        <strong className="text-teal-400 font-mono">Task: </strong>
                        <span className="text-slate-300">{sq.talkingPoints.task}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/70">
                        <strong className="text-indigo-400 font-mono">Action: </strong>
                        <span className="text-slate-300">{sq.talkingPoints.action}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/70">
                        <strong className="text-emerald-400 font-mono">Result: </strong>
                        <span className="text-slate-300">{sq.talkingPoints.result}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/70">
                        <strong className="text-amber-400 font-mono">Reflection: </strong>
                        <span className="text-slate-300">{sq.talkingPoints.reflection}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 glass-card rounded-2xl border border-slate-800 text-slate-400">
          <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
          <p className="text-base font-semibold text-white">Ready to Generate Tailored Application</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Click "Generate Tailored Pack" above to synthesize an evidence-grounded resume, cover letter, and interview talking points for {activeJob.title}.
          </p>
        </div>
      )}
    </div>
  );
};
