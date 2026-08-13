'use client';

import { useState, useEffect } from 'react';
import ClientLayoutShell from '@/components/ClientLayoutShell';

export default function ClientSettingsPage() {
  const [tenantInfo, setTenantInfo] = useState<any>({
    name: 'Acme Salon & Spa',
    subscription_status: 'trial',
    status: 'active',
    tenant_id: 'tenant-salon-alpha-1234',
  });
  const [loading, setLoading] = useState(false);

  return (
    <ClientLayoutShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account & Subscription Settings</h1>
          <p className="text-slate-500 text-sm">
            View tenant subscription details and platform settings.
          </p>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Subscription Status</h2>
              <p className="text-xs text-slate-500">Read-only account status managed by platform admin.</p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full uppercase">
              {tenantInfo.subscription_status} Plan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">Business Name</div>
              <div className="font-bold text-slate-900">{tenantInfo.name}</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">Tenant ID</div>
              <div className="font-mono text-xs text-slate-700 bg-slate-100 p-1.5 rounded">{tenantInfo.tenant_id}</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">Tenant Status</div>
              <div className="font-medium text-emerald-700 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Active</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">Billing Cycle</div>
              <div className="font-medium text-slate-800">Monthly Auto-Renewal</div>
            </div>
          </div>
        </div>

        {/* AI Integration Health */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">AI & Messaging Providers</h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-800">Primary AI Inference</span>
              <span className="font-bold text-indigo-600">DeepSeek API</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-800">Backup AI Fallback</span>
              <span className="font-bold text-slate-700">OpenAI API (gpt-4o-mini)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-800">Voice Note Transcription</span>
              <span className="font-bold text-emerald-700">Deepgram STT (Nova-2)</span>
            </div>
          </div>
        </div>
      </div>
    </ClientLayoutShell>
  );
}
