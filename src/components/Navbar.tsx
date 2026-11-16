// F.R.I.D.A.Y - Main Navigation Bar
import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  FileText,
  Briefcase,
  DollarSign,
  Settings,
  Sparkles,
  Lock,
  ExternalLink
} from 'lucide-react';
import type { AISettings } from '../types';

export type ActiveTab = 'profile' | 'match' | 'tailor' | 'crm' | 'earnFirst';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: AISettings;
  onOpenSettings: () => void;
  onOpenProModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  onOpenSettings,
  onOpenProModal
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-xl text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300">
                F.R.I.D.A.Y
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                v4.0 PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Evidence-First Career Copilot</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-500">Local-First Vault</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/70">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Profile & Evidence</span>
          </button>

          <button
            onClick={() => setActiveTab('match')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'match'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Job Match & Gates</span>
          </button>

          <button
            onClick={() => setActiveTab('tailor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'tailor'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tailor & Fact Gate</span>
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'crm'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Application CRM</span>
          </button>

          <button
            onClick={() => setActiveTab('earnFirst')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'earnFirst'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/30'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Earn-First Pilot</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* AI Tier Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            <span className={`w-2 h-2 rounded-full ${
              settings.tier === 'tier2_byok' ? 'bg-cyan-400' : 'bg-emerald-400'
            }`} />
            <span>
              {settings.tier === 'tier2_byok' ? 'BYOK Gemini' : 'Tier 1 Local'}
            </span>
          </div>

          {/* Pro Status / Upgrade */}
          {settings.isProUnlocked ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>PRO ACTIVE</span>
            </div>
          ) : (
            <button
              onClick={onOpenProModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-cyan-600/20 hover:shadow-cyan-500/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Get Pro ($14.99)</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="Settings & Privacy Vault"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden items-center justify-between px-3 py-2 border-t border-slate-800 bg-slate-950 text-xs overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-2.5 py-1 rounded ${activeTab === 'profile' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('match')}
          className={`px-2.5 py-1 rounded ${activeTab === 'match' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
        >
          Matcher
        </button>
        <button
          onClick={() => setActiveTab('tailor')}
          className={`px-2.5 py-1 rounded ${activeTab === 'tailor' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
        >
          Tailor
        </button>
        <button
          onClick={() => setActiveTab('crm')}
          className={`px-2.5 py-1 rounded ${activeTab === 'crm' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
        >
          CRM
        </button>
        <button
          onClick={() => setActiveTab('earnFirst')}
          className={`px-2.5 py-1 rounded ${activeTab === 'earnFirst' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-emerald-400'}`}
        >
          Earn Pilot
        </button>
      </div>
    </header>
  );
};
