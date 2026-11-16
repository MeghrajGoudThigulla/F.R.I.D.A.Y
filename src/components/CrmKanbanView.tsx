// F.R.I.D.A.Y - Application Kanban CRM & Pipeline Tracker (PRD v3.0 Journey E / PRD v4.0 R-10)
import React, { useState } from 'react';
import {
  Briefcase,
  Clock,
  Calendar,
  CheckCircle,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  User,
  DollarSign
} from 'lucide-react';
import type { ApplicationRecord, ApplicationStage } from '../types';

interface CrmKanbanViewProps {
  applications: ApplicationRecord[];
  onUpdateApplication: (app: ApplicationRecord) => Promise<void>;
  onDeleteApplication: (appId: string) => Promise<void>;
}

const STAGES: { id: ApplicationStage; label: string; color: string }[] = [
  { id: 'SAVED', label: 'Saved / Reviewing', color: 'border-slate-700 bg-slate-900/40 text-slate-300' },
  { id: 'READY', label: 'Pack Ready', color: 'border-cyan-800 bg-cyan-950/30 text-cyan-300' },
  { id: 'APPLIED', label: 'Applied', color: 'border-teal-800 bg-teal-950/30 text-teal-300' },
  { id: 'ASSESSMENT', label: 'Assessment / Screening', color: 'border-indigo-800 bg-indigo-950/30 text-indigo-300' },
  { id: 'INTERVIEW', label: 'Interviewing', color: 'border-amber-800 bg-amber-950/30 text-amber-300' },
  { id: 'OFFER', label: 'Offer / Negotiation', color: 'border-emerald-800 bg-emerald-950/30 text-emerald-300' },
  { id: 'REJECTED', label: 'Archived / Rejected', color: 'border-rose-900 bg-rose-950/20 text-rose-400' }
];

export const CrmKanbanView: React.FC<CrmKanbanViewProps> = ({
  applications,
  onUpdateApplication,
  onDeleteApplication
}) => {
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newSalary, setNewSalary] = useState('');

  const handleAdvanceStage = async (app: ApplicationRecord, nextStage: ApplicationStage) => {
    const updated: ApplicationRecord = {
      ...app,
      stage: nextStage,
      history: [
        ...app.history,
        {
          id: `hist-${Date.now()}`,
          timestamp: new Date().toISOString(),
          stage: nextStage,
          note: `Moved to ${nextStage}`
        }
      ],
      updatedAt: new Date().toISOString()
    };
    await onUpdateApplication(updated);
    if (selectedApp?.id === app.id) {
      setSelectedApp(updated);
    }
  };

  const handleAddNote = async () => {
    if (!selectedApp || !newNote.trim()) return;
    const updated: ApplicationRecord = {
      ...selectedApp,
      notes: selectedApp.notes ? `${selectedApp.notes}\n• ${newNote.trim()}` : `• ${newNote.trim()}`,
      updatedAt: new Date().toISOString()
    };
    await onUpdateApplication(updated);
    setSelectedApp(updated);
    setNewNote('');
  };

  const handleAddContact = async () => {
    if (!selectedApp || !newContactName.trim()) return;
    const newContact = {
      id: `contact-${Date.now()}`,
      name: newContactName.trim(),
      role: newContactRole.trim() || 'Recruiter / Hiring Manager',
      emailOrUrl: newContactEmail.trim() || undefined
    };
    const updated: ApplicationRecord = {
      ...selectedApp,
      contacts: [...selectedApp.contacts, newContact],
      updatedAt: new Date().toISOString()
    };
    await onUpdateApplication(updated);
    setSelectedApp(updated);
    setNewContactName('');
    setNewContactRole('');
    setNewContactEmail('');
  };

  const handleSaveSalary = async () => {
    if (!selectedApp) return;
    const updated: ApplicationRecord = {
      ...selectedApp,
      salaryOfferedOrDiscussed: newSalary.trim(),
      updatedAt: new Date().toISOString()
    };
    await onUpdateApplication(updated);
    setSelectedApp(updated);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-indigo-950/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 text-xs font-mono font-medium mb-3">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              <span>Personal Career CRM & Follow-Up Cadence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Application Pipeline & Kanban
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Tracks active opportunities, 5 & 10 business-day follow-up reminders, recruiter contacts, and salary negotiations.
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black font-mono text-cyan-400">{applications.length}</span>
            <span className="text-xs text-slate-400 block">Total Opportunities Tracked</span>
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageApps = applications.filter(a => a.stage === stage.id);
          return (
            <div
              key={stage.id}
              className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/60 min-w-[200px] h-[650px] p-3 space-y-3"
            >
              {/* Column Header */}
              <div className={`p-2 rounded-xl border flex items-center justify-between ${stage.color}`}>
                <span className="text-xs font-bold font-mono tracking-tight">{stage.label}</span>
                <span className="text-[11px] font-mono font-black px-1.5 py-0.2 rounded bg-slate-950/60">
                  {stageApps.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                {stageApps.length === 0 ? (
                  <div className="text-center py-10 text-[11px] text-slate-600 font-mono">
                    Empty
                  </div>
                ) : (
                  stageApps.map(app => (
                    <div
                      key={app.id}
                      onClick={() => {
                        setSelectedApp(app);
                        setNewSalary(app.salaryOfferedOrDiscussed || '');
                      }}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all shadow-sm hover:shadow-cyan-500/10 space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition leading-snug">
                          {app.jobTitle}
                        </h4>
                      </div>

                      <p className="text-[11px] text-cyan-400 font-medium">{app.company}</p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/80">
                        <span>{app.location}</span>
                        {app.appliedDate && (
                          <span className="flex items-center gap-1 text-teal-400">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{new Date(app.appliedDate).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Application Details Drawer / Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl glass-panel-glow rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {selectedApp.stage}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedApp.jobTitle}</h2>
                <p className="text-xs text-cyan-400 font-semibold">{selectedApp.company} • {selectedApp.location}</p>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Quick Stage Mover */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Advance Stage:</label>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleAdvanceStage(selectedApp, s.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition border ${
                      selectedApp.stage === s.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Salary Negotiation / Offer Tracking */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Compensation / Offer Details</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. $145,000 base + 15% bonus + RSUs or ₹18 LPA"
                  value={newSalary}
                  onChange={e => setNewSalary(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
                <button
                  onClick={handleSaveSalary}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Save Comp
                </button>
              </div>
            </div>

            {/* Recruiter & Team Contacts */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Key Contacts ({selectedApp.contacts.length})</span>
              </h4>

              {selectedApp.contacts.map(c => (
                <div key={c.id} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-slate-400 ml-2">({c.role})</span>
                  </div>
                  {c.emailOrUrl && <span className="text-cyan-400 font-mono">{c.emailOrUrl}</span>}
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Role (e.g. Lead Recruiter)"
                  value={newContactRole}
                  onChange={e => setNewContactRole(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Email / LinkedIn"
                    value={newContactEmail}
                    onChange={e => setNewContactEmail(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <button
                    onClick={handleAddContact}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Application Journal & Interview Notes</h4>
              {selectedApp.notes && (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                  {selectedApp.notes}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add note (e.g. Completed round 2 system design with Director)..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  onClick={handleAddNote}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold"
                >
                  Add Note
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={async () => {
                  if (confirm('Delete this application record?')) {
                    await onDeleteApplication(selectedApp.id);
                    setSelectedApp(null);
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Opportunity</span>
              </button>

              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
