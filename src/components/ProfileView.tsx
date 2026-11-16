// F.R.I.D.A.Y - Profile & Truthful Evidence Ledger View
import React, { useState } from 'react';
import {
  Upload,
  Mic,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';
import type { CandidateProfile, EvidenceFact, CareerClusterId, ReviewState } from '../types';
import { CAREER_CLUSTERS } from '../services/taxonomy';
import { parsePdfFile, parseDocxFile } from '../services/parser';
import { VoiceIntakeModal } from './VoiceIntakeModal';

interface ProfileViewProps {
  profile: CandidateProfile | null;
  facts: EvidenceFact[];
  onSaveProfile: (profile: CandidateProfile) => Promise<void>;
  onSaveFact: (fact: EvidenceFact) => Promise<void>;
  onDeleteFact: (factId: string) => Promise<void>;
  onImportParsedData: (profile: Partial<CandidateProfile>, facts: Omit<EvidenceFact, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  facts,
  onSaveProfile,
  onSaveFact,
  onDeleteFact,
  onImportParsedData
}) => {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editedStatement, setEditedStatement] = useState('');
  const [newFactStatement, setNewFactStatement] = useState('');
  const [newFactKind, setNewFactKind] = useState<EvidenceFact['kind']>('achievement');
  const [filterState, setFilterState] = useState<'ALL' | ReviewState>('ALL');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseError('');

    try {
      if (file.name.endsWith('.pdf')) {
        const res = await parsePdfFile(file);
        if (res.isScannedOrImagePdf) {
          setParseError('Warning: This PDF contains very little text. It may be a scanned image. Verified manual review is recommended.');
        }
        await onImportParsedData(res.extractedProfile, res.extractedFacts);
      } else if (file.name.endsWith('.docx')) {
        const res = await parseDocxFile(file);
        await onImportParsedData(res.extractedProfile, res.extractedFacts);
      } else {
        setParseError('Unsupported file type. Please upload a PDF or DOCX resume.');
      }
    } catch (err: any) {
      setParseError(`File parsing failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const handleVoiceIntakeComplete = async (answers: Record<string, string>) => {
    const extractedFacts: Omit<EvidenceFact, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>[] = [
      {
        kind: 'achievement',
        statement: answers.q2 || 'Recent professional history',
        rawExcerpt: answers.q2 || '',
        reviewState: 'CONFIRMED',
        sourceLocator: 'Voice Intake: Work History'
      },
      {
        kind: 'credential',
        statement: `Holds tools/credentials: ${answers.q3}`,
        rawExcerpt: answers.q3 || '',
        reviewState: 'CONFIRMED',
        sourceLocator: 'Voice Intake: Credentials'
      },
      {
        kind: 'achievement',
        statement: answers.q4 || 'Key career impact',
        rawExcerpt: answers.q4 || '',
        reviewState: 'CONFIRMED',
        sourceLocator: 'Voice Intake: Accomplishments'
      }
    ];

    const newProfile: Partial<CandidateProfile> = {
      headline: answers.q1 || 'Skilled Practitioner',
      summary: `${answers.q1 || 'Practitioner'} with proven experience: ${answers.q2}. Known for: ${answers.q4}`,
      shiftPreferences: answers.q5 || 'Day shift',
      licensesAndCertifications: answers.q3 ? answers.q3.split(',').map(s => s.trim()) : []
    };

    await onImportParsedData(newProfile, extractedFacts);
  };

  const handleUpdateFactStatus = async (fact: EvidenceFact, newStatus: ReviewState) => {
    await onSaveFact({
      ...fact,
      reviewState: newStatus,
      confirmedAt: newStatus === 'CONFIRMED' ? new Date().toISOString() : fact.confirmedAt,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveEditFact = async (fact: EvidenceFact) => {
    if (!editedStatement.trim()) return;
    await onSaveFact({
      ...fact,
      statement: editedStatement.trim(),
      reviewState: 'CORRECTED',
      updatedAt: new Date().toISOString()
    });
    setEditingFactId(null);
  };

  const handleAddNewFact = async () => {
    if (!newFactStatement.trim() || !profile) return;
    const newFact: EvidenceFact = {
      id: `fact-user-${Date.now()}`,
      profileId: profile.id,
      kind: newFactKind,
      statement: newFactStatement.trim(),
      rawExcerpt: 'Candidate direct manual input',
      reviewState: 'CONFIRMED',
      sourceLocator: 'Manual Entry',
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await onSaveFact(newFact);
    setNewFactStatement('');
  };

  const filteredFacts = facts.filter(f => {
    if (filterState === 'ALL') return true;
    return f.reviewState === filterState;
  });

  const confirmedCount = facts.filter(f => f.reviewState === 'CONFIRMED' || f.reviewState === 'CORRECTED').length;
  const unreviewedCount = facts.filter(f => f.reviewState === 'UNREVIEWED').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Quick Intake Options */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-cyan-950/20 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 text-xs font-mono font-medium mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Evidence Ledger Integrity Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Candidate Profile & Canonical Evidence Vault
            </h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              F.R.I.D.A.Y enforces a strict rule: <strong className="text-cyan-300 font-semibold">"Reformulate, never fabricate."</strong> Every tailored resume bullet and cover letter line must trace back to a candidate-confirmed fact in this ledger.
            </p>
          </div>

          {/* Intake Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
            {/* File Upload Button */}
            <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-cyan-300 border border-cyan-800/60 text-xs font-semibold cursor-pointer transition shadow-md hover:border-cyan-500">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>{isParsing ? 'Parsing Document...' : 'Import Resume (PDF/DOCX)'}</span>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                disabled={isParsing}
                className="hidden"
              />
            </label>

            {/* Voice-to-Resume Intake */}
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-cyan-600/20"
            >
              <Mic className="w-4 h-4 text-white" />
              <span>Voice / Chat Intake</span>
            </button>
          </div>
        </div>

        {parseError && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Profile Settings & Evidence Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Candidate Metadata & Occupational Domain */}
        {profile && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5 lg:col-span-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Identity & Domain</span>
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Local-Only
              </span>
            </div>

            {/* Career Cluster Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Occupational Cluster
              </label>
              <select
                value={profile.targetCluster}
                onChange={e => onSaveProfile({ ...profile, targetCluster: e.target.value as CareerClusterId })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
              >
                {Object.values(CAREER_CLUSTERS).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isDeepPack ? '★ (Deep Pack)' : '(Universal)'}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Archetype: {CAREER_CLUSTERS[profile.targetCluster]?.docArchetype}
              </p>
            </div>

            {/* Candidate Name & Title */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => onSaveProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Headline</label>
                <input
                  type="text"
                  value={profile.headline}
                  onChange={e => onSaveProfile({ ...profile, headline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Contact Details</label>
              <input
                type="email"
                placeholder="Email Address"
                value={profile.contact.email}
                onChange={e => onSaveProfile({ ...profile, contact: { ...profile.contact, email: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={profile.contact.phone || ''}
                onChange={e => onSaveProfile({ ...profile, contact: { ...profile.contact, phone: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <input
                type="text"
                placeholder="Location (City, State / Remote)"
                value={profile.contact.location || ''}
                onChange={e => onSaveProfile({ ...profile, contact: { ...profile.contact, location: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Critical Gate Fields */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Work Authorization Status
                </label>
                <input
                  type="text"
                  placeholder="e.g. US Citizen, Permanent Resident, H1B"
                  value={profile.workAuthorization}
                  onChange={e => onSaveProfile({ ...profile, workAuthorization: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Years of Professional Experience
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={profile.yearsOfExperience}
                  onChange={e => onSaveProfile({ ...profile, yearsOfExperience: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Licenses & Certifications (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. RN License, BLS, AWS Solutions Architect, OSHA-30"
                  value={profile.licensesAndCertifications.join(', ')}
                  onChange={e => onSaveProfile({
                    ...profile,
                    licensesAndCertifications: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Executive Profile Summary
              </label>
              <textarea
                rows={3}
                value={profile.summary}
                onChange={e => onSaveProfile({ ...profile, summary: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* Right Column: Truthful Evidence Ledger Table */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Truthful Evidence Ledger</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({confirmedCount} Verified, {unreviewedCount} Pending)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Each fact preserves its original source excerpt to prevent hallucination.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              {(['ALL', 'CONFIRMED', 'UNREVIEWED', 'REJECTED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterState(st)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                    filterState === st
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Add New Fact Input */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Verified Proof Point to Ledger</span>
            </span>
            <div className="flex gap-2">
              <select
                value={newFactKind}
                onChange={e => setNewFactKind(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="achievement">Achievement</option>
                <option value="skill">Skill</option>
                <option value="credential">Credential</option>
                <option value="employment">Employment</option>
              </select>
              <input
                type="text"
                placeholder="e.g. Led 12 nurses in trauma ICU or Reduced cloud compute costs by 35%..."
                value={newFactStatement}
                onChange={e => setNewFactStatement(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNewFact()}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                onClick={handleAddNewFact}
                disabled={!newFactStatement.trim()}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold disabled:opacity-40 transition"
              >
                Add Fact
              </button>
            </div>
          </div>

          {/* Facts List */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredFacts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No evidence facts matching this filter.
              </div>
            ) : (
              filteredFacts.map(fact => (
                <div
                  key={fact.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    fact.reviewState === 'CONFIRMED' || fact.reviewState === 'CORRECTED'
                      ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/30'
                      : fact.reviewState === 'REJECTED'
                      ? 'bg-rose-950/20 border-rose-900/30 opacity-60'
                      : 'bg-amber-950/15 border-amber-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {/* Kind & Status Badges */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {fact.kind}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            fact.reviewState === 'CONFIRMED' || fact.reviewState === 'CORRECTED'
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                              : fact.reviewState === 'REJECTED'
                              ? 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                              : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                          }`}
                        >
                          {fact.reviewState}
                        </span>
                        {fact.sourceLocator && (
                          <span className="text-[11px] text-slate-500 italic">
                            Source: {fact.sourceLocator}
                          </span>
                        )}
                      </div>

                      {/* Fact Statement or Edit Form */}
                      {editingFactId === fact.id ? (
                        <div className="space-y-2 mt-2">
                          <input
                            type="text"
                            value={editedStatement}
                            onChange={e => setEditedStatement(e.target.value)}
                            className="w-full bg-slate-950 border border-cyan-500 rounded-lg p-2 text-xs text-white"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEditFact(fact)}
                              className="px-2.5 py-1 rounded bg-cyan-600 text-white text-[11px] font-semibold"
                            >
                              Save Corrected
                            </button>
                            <button
                              onClick={() => setEditingFactId(null)}
                              className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-100 text-xs font-medium leading-relaxed">
                          {fact.statement}
                        </p>
                      )}

                      {/* Raw Excerpt provenance */}
                      {fact.rawExcerpt && fact.rawExcerpt !== fact.statement && (
                        <div className="mt-1.5 text-[11px] text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/70">
                          <span className="text-slate-500 font-mono">Excerpt: </span>
                          "{fact.rawExcerpt}"
                        </div>
                      )}
                    </div>

                    {/* Actions: Confirm, Reject, Edit, Delete */}
                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      {fact.reviewState !== 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateFactStatus(fact, 'CONFIRMED')}
                          className="p-1 rounded hover:bg-emerald-950 text-slate-400 hover:text-emerald-400 transition"
                          title="Confirm as Verified Truth"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}

                      {fact.reviewState !== 'REJECTED' && (
                        <button
                          onClick={() => handleUpdateFactStatus(fact, 'REJECTED')}
                          className="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                          title="Reject / Disregard"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingFactId(fact.id);
                          setEditedStatement(fact.statement);
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                        title="Edit Statement"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteFact(fact.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition"
                        title="Delete from Ledger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Voice Intake Modal */}
      <VoiceIntakeModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onComplete={handleVoiceIntakeComplete}
      />
    </div>
  );
};
