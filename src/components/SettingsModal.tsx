// F.R.I.D.A.Y - Settings, BYOK Gemini, Pro License & Encrypted Vault Modal
import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Key,
  Cpu,
  Sparkles,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  Lock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import type { AISettings } from '../types';
import {
  exportEncryptedBackup,
  importAndRestoreBackup,
  clearAllLocalVault,
  validatePassphraseStrength
} from '../db';
import {
  verifyLicenseKey,
  OFFICIAL_DEMO_PRO_LICENSE,
  PAYMENT_LINKS,
  triggerProCheckout
} from '../services/monetization';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSaveSettings: (settings: AISettings) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onRefreshData
}) => {
  const [tier, setTier] = useState<AISettings['tier']>(settings.tier);
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [selectedModel, setSelectedModel] = useState(settings.selectedGeminiModel || 'gemini-2.5-flash');
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseMsg, setLicenseMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Backup state
  const [passphrase, setPassphrase] = useState('');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveAI = async () => {
    await onSaveSettings({
      ...settings,
      tier,
      geminiApiKey: geminiKey.trim(),
      selectedGeminiModel: selectedModel
    });
    setLicenseMsg({ text: 'AI Settings saved successfully.', isError: false });
  };

  const handleActivateLicense = async () => {
    const res = await verifyLicenseKey(licenseInput);
    if (res.isValid) {
      await onSaveSettings({
        ...settings,
        isProUnlocked: true,
        proLicenseKey: licenseInput.trim()
      });
      setLicenseMsg({ text: res.message, isError: false });
    } else {
      setLicenseMsg({ text: res.message, isError: true });
    }
  };

  const handleExportBackup = async () => {
    const check = validatePassphraseStrength(passphrase);
    if (!check.isValid) {
      alert(check.error || 'Please enter a valid passphrase.');
      return;
    }
    try {
      const backupJson = await exportEncryptedBackup(passphrase.trim());
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FRIDAY_Vault_Backup_${new Date().toISOString().slice(0, 10)}.friday`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatus('Encrypted backup exported with SHA-256 integrity checksum.');
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!passphrase.trim()) {
      alert('Please enter the decryption passphrase for this backup.');
      return;
    }

    try {
      const text = await file.text();
      const res = await importAndRestoreBackup(text, passphrase.trim());
      if (res.success) {
        setBackupStatus(res.message);
        await onRefreshData();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    }
    e.target.value = '';
  };

  const handleWipeData = async () => {
    if (confirm('CRITICAL: This will permanently delete all candidate profiles, evidence facts, jobs, and applications stored on this device. Are you sure?')) {
      await clearAllLocalVault();
      await onRefreshData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel-glow rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">System Settings & Local Vault</h2>
              <p className="text-[11px] text-slate-400 font-mono">100% Client-Side • Zero Telemetry • Strict Privacy</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: 3-Tier AI Engine Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>3-Tier AI Engine Router (PRD v2.0 §1 & PRD v4.0)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Zero Setup Drop-off</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tier 1 Option */}
            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                tier === 'tier1_local'
                  ? 'bg-cyan-950/30 border-cyan-500/70 text-cyan-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">Tier 1: In-Browser Deterministic</span>
                  <input
                    type="radio"
                    name="aiTier"
                    checked={tier === 'tier1_local'}
                    onChange={() => setTier('tier1_local')}
                    className="accent-cyan-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  100% Free & offline. Uses deterministic NLP and strict rule-based Drafter-Reviewer. No API key needed.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 mt-2 block">✓ $0 Cost Forever</span>
            </label>

            {/* Tier 2 BYOK Option */}
            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                tier === 'tier2_byok'
                  ? 'bg-cyan-950/30 border-cyan-500/70 text-cyan-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">Tier 2: Guided BYOK Gemini</span>
                  <input
                    type="radio"
                    name="aiTier"
                    checked={tier === 'tier2_byok'}
                    onChange={() => setTier('tier2_byok')}
                    className="accent-cyan-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Connect your personal Google Gemini API key. Calls generativelanguage.googleapis.com directly from your browser.
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 mt-2 block">✓ Free Tier Available</span>
            </label>
          </div>

          {/* BYOK Inputs */}
          {tier === 'tier2_byok' && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Google Gemini API Key</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  <span>Get Free Key at Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Model Selection:</span>
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSaveAI}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
            >
              Save AI Settings
            </button>
          </div>
        </div>

        {/* SECTION 2: Pro Career Pass & Licensing */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lifetime Pro Career Pass ($14.99 or ₹499 in India)</span>
            </h3>
            {settings.isProUnlocked && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold">
                ACTIVE
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Unlocks all 7 domain-specific ATS templates, multi-persona profiles, and unlimited offline export. Validated cryptographically offline.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste cryptographically signed license token..."
              value={licenseInput}
              onChange={e => setLicenseInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <button
              onClick={() => setLicenseInput(OFFICIAL_DEMO_PRO_LICENSE)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:text-cyan-300 text-[11px] font-mono border border-slate-700"
              title="Insert Signed Test Token"
            >
              Test Token
            </button>
            <button
              onClick={handleActivateLicense}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
            >
              Verify & Activate
            </button>
            <button
              onClick={() => triggerProCheckout('polar')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800 text-xs font-semibold flex items-center gap-1"
            >
              <span>Buy ($14.99)</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {licenseMsg && (
            <p className={`text-xs ${licenseMsg.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
              {licenseMsg.text}
            </p>
          )}
        </div>

        {/* SECTION 3: Encrypted Vault Backup & Restore (FR-120 / R-12) */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Encrypted Backup & Recovery (AES-GCM + SHA-256 Checksum)</span>
          </h3>

          <p className="text-xs text-slate-400">
            Export a military-grade encrypted backup of your entire career vault to your local disk.
          </p>

          <input
            type="password"
            placeholder="Enter passphrase to encrypt / decrypt your backup..."
            value={passphrase}
            onChange={e => setPassphrase(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
          />

          <div className="flex gap-3">
            <button
              onClick={handleExportBackup}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-800/60 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Encrypted Vault</span>
            </button>

            <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 text-xs font-semibold cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore Backup</span>
              <input
                type="file"
                accept=".friday,.json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </label>
          </div>

          {backupStatus && (
            <p className="text-xs text-emerald-400 font-mono">{backupStatus}</p>
          )}
        </div>

        {/* SECTION 4: Data Erasure */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-400 block">Wipe Local Device Vault</span>
            <span className="text-[11px] text-slate-500">Irreversibly delete all local records from this browser.</span>
          </div>

          <button
            onClick={handleWipeData}
            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};
