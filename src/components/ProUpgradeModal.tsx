// F.R.I.D.A.Y - Pro Career Pass Upgrade Modal
import React, { useState } from 'react';
import { X, Sparkles, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  triggerProCheckout,
  verifyLicenseKey,
  OFFICIAL_DEMO_PRO_LICENSE
} from '../services/monetization';
import type { AISettings } from '../types';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSaveSettings: (settings: AISettings) => Promise<void>;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [msg, setMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleActivate = async () => {
    const res = await verifyLicenseKey(licenseKey);
    if (res.isValid) {
      await onSaveSettings({
        ...settings,
        isProUnlocked: true,
        proLicenseKey: licenseKey.trim()
      });
      setMsg({ text: 'Congratulations! Pro Career Pass verified and activated.', isError: false });
      setTimeout(onClose, 1500);
    } else {
      setMsg({ text: res.message, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-xl glass-panel-glow rounded-3xl bg-slate-900 border border-slate-700 p-7 shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>ONE-TIME LIFETIME PURCHASE • NO MONTHLY BILLS</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Unlock F.R.I.D.A.Y Pro Career Pass
          </h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Mainstream trackers charge $29 to $40 every single month. F.R.I.D.A.Y Pro gives you lifetime access for a single payment.
          </p>
        </div>

        {/* Pricing Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[11px] font-mono text-slate-500 block">Competitor Monthly SaaS</span>
            <span className="text-xl font-bold text-slate-400 line-through">$348 / year</span>
            <span className="text-[10px] text-rose-400 block mt-1">($29/mo recurring)</span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/50 to-indigo-950/50 border border-cyan-500/40 text-center shadow-lg shadow-cyan-950/50">
            <span className="text-[11px] font-mono text-cyan-300 font-bold block">F.R.I.D.A.Y Lifetime</span>
            <span className="text-2xl font-black font-mono text-white">$14.99</span>
            <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">One-time payment (or ₹499 in India)</span>
          </div>
        </div>

        {/* Pro Feature Highlights */}
        <div className="space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>All 7 Domain Archetypes:</strong> Clinical CV, Skilled Trades Ticket, Federal USAJobs 2-Page CV, Finance, and Creative.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Unlimited Multi-Persona Profiles:</strong> Switch between roles (e.g. ICU Nurse vs Clinical Director) without data loss.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Bulk Job Folder Scorer:</strong> Evaluate 20 clipped jobs simultaneously with 4-pillar rankings.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Encrypted Cloud Sync Architecture:</strong> Backup to user-owned Google Drive appDataFolder.</span>
          </div>
        </div>

        {/* Purchase CTA Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => triggerProCheckout('polar')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/25"
          >
            <span>Buy via Polar.sh ($14.99)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => triggerProCheckout('dodo')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 text-xs font-bold transition"
          >
            <span>Dodo Payments (₹499 India)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* License Key Activation Input */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-mono text-slate-400">
              Paste cryptographically signed license token:
            </label>
            <button
              onClick={() => setLicenseKey(OFFICIAL_DEMO_PRO_LICENSE)}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline"
            >
              Insert Demo Token
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste license token..."
              value={licenseKey}
              onChange={e => setLicenseKey(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <button
              onClick={handleActivate}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
            >
              Verify & Activate
            </button>
          </div>
          {msg && (
            <p className={`text-xs ${msg.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
              {msg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
