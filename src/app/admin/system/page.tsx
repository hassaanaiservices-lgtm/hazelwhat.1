'use client';

import { useState, useEffect } from 'react';

export default function AdminSystemHealthPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/system-health');
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System & AI Health</h1>
          <p className="text-slate-500 text-xs mt-0.5">Real-time status of application server, database, and AI providers.</p>
        </div>
        <button
          onClick={fetchSystemHealth}
          className="bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all border border-slate-200 shadow-xs flex items-center space-x-1.5"
        >
          <span>↻ Refresh Diagnostics</span>
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 py-12 text-center text-xs">Running live network health checks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Core App & Database Health */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Core Infrastructure</h2>
            
            <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl">
              <div>
                <div className="font-semibold text-xs text-slate-900">Next.js Web Server</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Node runtime & HTTP router</div>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold">
                HEALTHY
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl">
              <div>
                <div className="font-semibold text-xs text-slate-900">Postgres Database Connection</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Latency: {healthData?.supabaseStatus?.latencyMs || 0}ms</div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                  healthData?.supabaseStatus?.status === 'healthy'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {healthData?.supabaseStatus?.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
          </div>

          {/* AI Providers Reachability */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">AI Providers Status</h2>

            {healthData?.aiProviders?.map((provider: any) => (
              <div key={provider.name} className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl">
                <div>
                  <div className="font-semibold text-xs text-slate-900">{provider.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    HTTP {provider.httpStatus} • {provider.latencyMs}ms latency
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    provider.status === 'healthy'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {provider.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
