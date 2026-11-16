// F.R.I.D.A.Y - Universal Career Copilot & Job Matcher
// Main Application Container
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_AI_SETTINGS } from './db';
import { seedDemoDataIfEmpty } from './db/seed';
import type {
  CandidateProfile,
  EvidenceFact,
  JobPosting,
  TailoredDocument,
  ApplicationRecord,
  AISettings,
  EarnFirstOrder
} from './types';
import { Navbar, type ActiveTab } from './components/Navbar';
import { ProfileView } from './components/ProfileView';
import { JobMatchView } from './components/JobMatchView';
import { TailoringView } from './components/TailoringView';
import { CrmKanbanView } from './components/CrmKanbanView';
import { EarnFirstHubView } from './components/EarnFirstHubView';
import { SettingsModal } from './components/SettingsModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Initialize seed demo data if vault is empty
  useEffect(() => {
    seedDemoDataIfEmpty().catch(console.error);
  }, []);

  // Reactive Dexie Queries
  const profiles = useLiveQuery(() => db.profiles.toArray(), []);
  const facts = useLiveQuery(() => db.evidenceFacts.toArray(), []) || [];
  const jobs = useLiveQuery(() => db.jobPostings.toArray(), []) || [];
  const applications = useLiveQuery(() => db.applications.toArray(), []) || [];
  const orders = useLiveQuery(() => db.earnFirstOrders.toArray(), []) || [];
  const settingsList = useLiveQuery(() => db.settings.toArray(), []);

  const profile: CandidateProfile | null = profiles && profiles.length > 0 ? profiles[0] : null;
  const settings: AISettings = settingsList && settingsList.length > 0 ? settingsList[0] : DEFAULT_AI_SETTINGS;

  // Active Job selection
  const activeJob: JobPosting | null = jobs.find(j => j.id === activeJobId) || (jobs.length > 0 ? jobs[0] : null);

  // Active Tailored Document query
  const tailoredDocs = useLiveQuery<TailoredDocument[]>(
    () => (activeJob ? db.tailoredDocuments.where('postingId').equals(activeJob.id).toArray() : Promise.resolve<TailoredDocument[]>([])),
    [activeJob?.id]
  ) || [];
  const activeTailoredDoc: TailoredDocument | null = tailoredDocs.length > 0 ? tailoredDocs[0] : null;

  // Handlers for Profile & Facts
  const handleSaveProfile = async (updatedProfile: CandidateProfile) => {
    await db.profiles.put({
      ...updatedProfile,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveFact = async (fact: EvidenceFact) => {
    await db.evidenceFacts.put(fact);
  };

  const handleDeleteFact = async (factId: string) => {
    await db.evidenceFacts.delete(factId);
  };

  const handleImportParsedData = async (
    parsedProfile: Partial<CandidateProfile>,
    parsedFacts: Omit<EvidenceFact, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>[]
  ) => {
    const profileId = profile?.id || `profile-${Date.now()}`;
    const baseProfile: CandidateProfile = {
      id: profileId,
      name: parsedProfile.name || profile?.name || 'Candidate',
      headline: parsedProfile.headline || profile?.headline || 'Professional',
      contact: {
        email: parsedProfile.contact?.email || profile?.contact?.email || '',
        phone: parsedProfile.contact?.phone || profile?.contact?.phone || '',
        location: parsedProfile.contact?.location || profile?.contact?.location || ''
      },
      summary: parsedProfile.summary || profile?.summary || '',
      targetCluster: parsedProfile.targetCluster || profile?.targetCluster || 'software_data',
      yearsOfExperience: parsedProfile.yearsOfExperience || profile?.yearsOfExperience || 3,
      licensesAndCertifications: parsedProfile.licensesAndCertifications || profile?.licensesAndCertifications || [],
      workAuthorization: parsedProfile.workAuthorization || profile?.workAuthorization || 'Citizen / Right to Work',
      shiftPreferences: parsedProfile.shiftPreferences || profile?.shiftPreferences || 'Day shift',
      securityClearance: parsedProfile.securityClearance || profile?.securityClearance || 'None',
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.profiles.put(baseProfile);

    // Bulk add facts with unique IDs
    const newFacts: EvidenceFact[] = parsedFacts.map((pf, idx) => ({
      ...pf,
      id: `fact-imported-${Date.now()}-${idx}`,
      profileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    if (newFacts.length > 0) {
      await db.evidenceFacts.bulkAdd(newFacts);
    }
  };

  // Handlers for Jobs
  const handleSaveJob = async (job: JobPosting) => {
    await db.jobPostings.put(job);
    setActiveJobId(job.id);
  };

  // Handlers for Tailored Docs
  const handleSaveTailoredDoc = async (doc: TailoredDocument) => {
    await db.tailoredDocuments.put(doc);
  };

  const handleMarkAsApplied = async (job: JobPosting, doc: TailoredDocument) => {
    if (!profile) return;
    const existing = await db.applications.where('postingId').equals(job.id).first();

    const appRecord: ApplicationRecord = {
      id: existing?.id || `app-${job.id}-${Date.now()}`,
      postingId: job.id,
      profileId: profile.id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      stage: 'APPLIED',
      appliedDate: new Date().toISOString(),
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5-day follow up
      notes: existing?.notes || `Tailored ATS pack compiled on ${new Date().toLocaleDateString()}.`,
      contacts: existing?.contacts || [],
      history: [
        ...(existing?.history || []),
        {
          id: `hist-${Date.now()}`,
          timestamp: new Date().toISOString(),
          stage: 'APPLIED',
          note: 'Marked applied via F.R.I.D.A.Y Tailoring Studio.'
        }
      ],
      updatedAt: new Date().toISOString()
    };

    await db.applications.put(appRecord);
    setActiveTab('crm');
  };

  // Handlers for CRM Applications
  const handleUpdateApplication = async (app: ApplicationRecord) => {
    await db.applications.put(app);
  };

  const handleDeleteApplication = async (appId: string) => {
    await db.applications.delete(appId);
  };

  // Handlers for Earn-First Orders
  const handleSaveOrder = async (order: EarnFirstOrder) => {
    await db.earnFirstOrders.put(order);
  };

  const handleDeleteOrder = async (orderId: string) => {
    await db.earnFirstOrders.delete(orderId);
  };

  // Handlers for Settings
  const handleSaveSettings = async (newSettings: AISettings) => {
    await db.settings.clear();
    await db.settings.add(newSettings);
  };

  const handleRefreshData = async () => {
    // Dexie reactive queries update automatically
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProModal={() => setIsProModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            facts={facts}
            onSaveProfile={handleSaveProfile}
            onSaveFact={handleSaveFact}
            onDeleteFact={handleDeleteFact}
            onImportParsedData={handleImportParsedData}
          />
        )}

        {activeTab === 'match' && (
          <JobMatchView
            profile={profile}
            facts={facts}
            jobs={jobs}
            activeJob={activeJob}
            setActiveJob={job => setActiveJobId(job.id)}
            onSaveJob={handleSaveJob}
            onProceedToTailoring={job => {
              setActiveJobId(job.id);
              setActiveTab('tailor');
            }}
          />
        )}

        {activeTab === 'tailor' && (
          <TailoringView
            profile={profile}
            facts={facts}
            activeJob={activeJob}
            settings={settings}
            tailoredDoc={activeTailoredDoc}
            onSaveTailoredDoc={handleSaveTailoredDoc}
            onMarkAsApplied={handleMarkAsApplied}
          />
        )}

        {activeTab === 'crm' && (
          <CrmKanbanView
            applications={applications}
            onUpdateApplication={handleUpdateApplication}
            onDeleteApplication={handleDeleteApplication}
          />
        )}

        {activeTab === 'earnFirst' && (
          <EarnFirstHubView
            orders={orders}
            onSaveOrder={handleSaveOrder}
            onDeleteOrder={handleDeleteOrder}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>F.R.I.D.A.Y • Universal Career Copilot & Evidence-First Job Matcher</span>
          <span>Zero-Capital Local-First Vault • $0 Fixed Operating Cost</span>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onRefreshData={handleRefreshData}
      />

      <ProUpgradeModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
};

export default App;
