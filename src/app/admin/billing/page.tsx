'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminBillingPage() {
  const [billingOverviews, setBillingOverviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/billing');
      const data = await res.json();
      if (data.billingOverviews) {
        setBillingOverviews(data.billingOverviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const totalMessageVolume = billingOverviews.reduce((acc, curr) => acc + (curr.messageVolume || 0), 0);
  const totalEstimatedCost = billingOverviews.reduce((acc, curr) => acc + (curr.estimatedAiCost || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Usage & Billing</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Client Subscription Statuses, Message Volumes & Estimated AI Inference Costs
          </p>
        </div>
        <Link
          href="/admin"
          className="bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all border border-slate-200 shadow-xs"
        >
          ← Back to Overview
        </Link>
      </div>

      {/* Summary Metric Cards (Matching DashMark top metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Client Tenants</div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : billingOverviews.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active platform client accounts</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Platform Message Volume</div>
          <div className="text-2xl font-black text-violet-700">
            {loading ? '...' : totalMessageVolume}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total processed text & media messages</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Platform AI Cost</div>
          <div className="text-2xl font-black text-emerald-600">
            ${loading ? '...' : totalEstimatedCost.toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Calculated AI LLM & STT provider costs</div>
        </div>
      </div>

      {/* Client Usage & Subscription Status Table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Client Subscription & Usage Breakdown</h2>
          <span className="text-xs text-slate-400 font-mono">Live Data Aggregation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold">Client / Tenant Name</th>
                <th className="px-6 py-4 font-bold">Tenant ID</th>
                <th className="px-6 py-4 font-bold">Subscription Status</th>
                <th className="px-6 py-4 font-bold">Message Volume</th>
                <th className="px-6 py-4 font-bold text-right">Rough Est. AI Cost ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Loading client billing overview...
                  </td>
                </tr>
              ) : billingOverviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No client tenants provisioned yet.
                  </td>
                </tr>
              ) : (
                billingOverviews.map((item) => (
                  <tr key={item.tenantId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{item.tenantName}</td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{item.tenantId}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold ${
                          item.subscriptionStatus === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.subscriptionStatus === 'trial'
                            ? 'bg-violet-50 text-violet-700 border border-violet-200'
                            : item.subscriptionStatus === 'past_due'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {item.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 font-mono">{item.messageVolume} msgs</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 font-mono text-sm">
                      ${Number(item.estimatedAiCost).toFixed(3)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
