// F.R.I.D.A.Y - Earn-First Zero-Capital Hub (PRD v4.0 Earn-First Plan)
import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileText,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import type { EarnFirstOrder } from '../types';
import { PAYMENT_LINKS } from '../services/monetization';

interface EarnFirstHubViewProps {
  orders: EarnFirstOrder[];
  onSaveOrder: (order: EarnFirstOrder) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
}

export const EarnFirstHubView: React.FC<EarnFirstHubViewProps> = ({
  orders,
  onSaveOrder,
  onDeleteOrder
}) => {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [packageType, setPackageType] = useState<EarnFirstOrder['packageType']>('manual_pack_9');
  const [orderPrice, setOrderPrice] = useState(9);
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');

  const totalEarned = orders
    .filter(o => o.status === 'payment_confirmed' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.price, 0);

  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  const handleCreateOrder = async () => {
    if (!clientName.trim() || !clientEmail.trim()) return;

    const newOrder: EarnFirstOrder = {
      id: `order-${Date.now()}`,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      jobTitle: jobTitle.trim() || 'Target Position',
      company: company.trim() || 'Target Company',
      packageType,
      price: orderPrice,
      currency,
      status: 'payment_confirmed',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    await onSaveOrder(newOrder);
    setIsCreatingOrder(false);
    setClientName('');
    setClientEmail('');
    setJobTitle('');
    setCompany('');
    setNotes('');
  };

  const handleUpdateStatus = async (order: EarnFirstOrder, newStatus: EarnFirstOrder['status']) => {
    await onSaveOrder({
      ...order,
      status: newStatus,
      deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : order.deliveredAt
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-emerald-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-emerald-950/25 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-mono font-medium mb-3">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>PRD v4.0 Earn-First Zero-Capital Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Earn-First Pilot Hub & Client Deliverables
            </h1>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              <strong>Fastest Path to Cash ($0 Upfront Cost):</strong> Sell human-reviewed tailored packs ($9–$19) to pilot job seekers on LinkedIn, Reddit, or WhatsApp. F.R.I.D.A.Y does the heavy lifting (fact-checking & tailoring); you verify and deliver.
            </p>
          </div>

          {/* Revenue Metric Cards */}
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-800/60 text-center min-w-[120px]">
              <span className="text-[11px] text-slate-400 font-mono block">Total Revenue</span>
              <span className="text-2xl font-black font-mono text-emerald-400">${totalEarned}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-800/60 text-center min-w-[120px]">
              <span className="text-[11px] text-slate-400 font-mono block">Packs Delivered</span>
              <span className="text-2xl font-black font-mono text-cyan-400">{deliveredCount} / 5</span>
            </div>
          </div>
        </div>

        {/* 5-Client Pilot Goal Progress */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="flex justify-between text-xs mb-1.5 font-mono">
            <span className="text-slate-300">Phase 1 Validation Gate: 5 Paid Pilot Deliveries</span>
            <span className="text-emerald-400 font-bold">{deliveredCount} of 5 Completed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (deliveredCount / 5) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Blueprint Strategy & Order Creation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: 3-Step Playbook */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 lg:col-span-1 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Zero-Capital Earning Playbook</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="font-mono text-emerald-400 font-bold">Step 1: Offer the Pack</span>
              <p className="text-slate-300 leading-relaxed">
                Post on LinkedIn or message active job seekers: <em className="text-cyan-300 font-normal">"I'm providing a tailored ATS-verified application pack (custom resume, cover letter & 5 interview questions with 100% verified facts) for $9."</em>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="font-mono text-cyan-400 font-bold">Step 2: Collect Payment</span>
              <p className="text-slate-300 leading-relaxed">
                Send your Polar, Dodo Payments, or direct UPI/Bank link. Customer payment arrives directly to your account with zero platform monthly fee.
              </p>
              <div className="pt-2 flex flex-col gap-1.5">
                <a
                  href={PAYMENT_LINKS.polarProPass}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  <span>Polar.sh Hosted Checkout</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={PAYMENT_LINKS.dodoProPassIndia}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  <span>Dodo Payments Checkout</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="font-mono text-indigo-400 font-bold">Step 3: Deliver via F.R.I.D.A.Y</span>
              <p className="text-slate-300 leading-relaxed">
                Load client's resume in the Profile tab, add target job in Job Matcher, click "Generate Pack", inspect Fact Gate badges, and export their ATS PDF. Deliver within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Paid Orders Manager */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Client Orders & Production Queue</h3>
              <p className="text-xs text-slate-400 mt-0.5">Track deliverables, payment status, and client fulfillment.</p>
            </div>

            <button
              onClick={() => setIsCreatingOrder(!isCreatingOrder)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingOrder ? 'Cancel' : 'Log New Order'}</span>
            </button>
          </div>

          {/* New Order Form */}
          {isCreatingOrder && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-800/60 space-y-3 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold text-emerald-300">New Client Order</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Client Full Name *"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="email"
                  placeholder="Client Email *"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Target Role (e.g. ICU Nurse or Frontend Dev)"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Target Company"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <select
                  value={packageType}
                  onChange={e => {
                    const val = e.target.value as any;
                    setPackageType(val);
                    if (val === 'manual_pack_9') setOrderPrice(9);
                    else if (val === 'manual_pack_19') setOrderPrice(19);
                    else setOrderPrice(49);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="manual_pack_9">Starter Application Pack ($9)</option>
                  <option value="manual_pack_19">Pro Tailored Pack + Cover Letter ($19)</option>
                  <option value="coaching_49">Full Career Review + STAR Prep ($49)</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={orderPrice}
                    onChange={e => setOrderPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <textarea
                placeholder="Client notes or specific target job URL..."
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white resize-none"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsCreatingOrder(false)}
                  className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={!clientName.trim() || !clientEmail.trim()}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-40"
                >
                  Save Order
                </button>
              </div>
            </div>
          )}

          {/* Orders List */}
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No client orders logged yet. Click "Log New Order" above after booking your first client!
              </div>
            ) : (
              orders.map(order => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{order.clientName}</span>
                      <span className="text-xs text-slate-400 font-mono">({order.clientEmail})</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                          order.status === 'delivered'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : order.status === 'payment_confirmed'
                            ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      Target: <strong className="text-cyan-300">{order.jobTitle}</strong> @ {order.company}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>Package: {order.packageType}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">{order.currency === 'INR' ? '₹' : '$'}{order.price}</span>
                      <span>•</span>
                      <span>Logged: {new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {order.status !== 'delivered' ? (
                      <button
                        onClick={() => handleUpdateStatus(order, 'delivered')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 text-xs font-semibold transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mark Delivered</span>
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Delivered</span>
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="p-1.5 rounded text-slate-500 hover:text-rose-400 transition"
                      title="Delete Order"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
