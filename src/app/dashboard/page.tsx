'use client';

import { useState, useEffect } from 'react';
import ClientLayoutShell from '@/components/ClientLayoutShell';
import Link from 'next/link';

export default function ClientDashboardPage() {
  const [metrics, setMetrics] = useState<any>({
    messagesToday: 142,
    totalConversations: 86,
    aiHandledCount: 74,
    humanHandledCount: 12,
    activeCustomers: 48,
    totalOrders: 364,
    totalAppointments: 18,
    pendingEscalations: 3,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'assigned' | 'completed'>('all');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/client/metrics');
      const data = await res.json();
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const recentOrders = [
    {
      id: '#875412903',
      customer: 'Munich, DE → Rotterdam, NL',
      agent: 'WhatsApp AI Agent (DeepSeek)',
      status: 'Assigned',
      statusColor: 'bg-violet-100 text-violet-700 border-violet-200',
      date: '05 Oct, 2026',
    },
    {
      id: '#438729654',
      customer: 'Warsaw, PL → Oslo, NO',
      agent: 'WhatsApp AI Agent (Copilot)',
      status: 'Completed',
      statusColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      date: '02 Oct, 2026',
    },
    {
      id: '#910283746',
      customer: 'Paris, FR → Vienna, AT',
      agent: 'Escalated to Human Representative',
      status: 'Unassigned',
      statusColor: 'bg-amber-100 text-amber-700 border-amber-200',
      date: '01 Oct, 2026',
    },
  ];

  return (
    <ClientLayoutShell>
      <div className="space-y-8 font-sans antialiased">
        {/* Top Greeting */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Hello, Clara</span>
              <span>👋</span>
            </h1>
            <p className="text-slate-400 text-xs font-semibold mt-1">
              Here's what's happening with your business automation today.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Live Mode:</span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>AI Autopilot Active</span>
            </span>
          </div>
        </div>

        {/* Hero Cards Grid (Nexora Column 1 & 2 Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Hero Gradient Wave Analytics Card */}
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-extrabold uppercase tracking-wider text-violet-200">
                Fulfillment Performance
              </span>
              <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                This month ▾
              </span>
            </div>

            <div className="z-10 space-y-1">
              <div className="text-4xl font-black tracking-tight">92%</div>
              <div className="inline-flex items-center space-x-1 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                <span>▲</span>
                <span>12% vs last month</span>
              </div>
            </div>

            {/* SVG Wave Line Graph */}
            <div className="relative h-20 w-full z-10 pt-2">
              <svg className="w-full h-full text-white/80 overflow-visible" viewBox="0 0 300 80" fill="none">
                <path
                  d="M0 60 C 50 30, 100 70, 150 40 C 200 10, 250 50, 300 20"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="260" cy="27" r="6" fill="#ffffff" />
                <rect x="235" y="0" width="50" height="20" rx="10" fill="#ffffff" />
                <text x="260" y="14" fill="#6366f1" fontSize="10" fontWeight="bold" textAnchor="middle">
                  92%
                </text>
              </svg>
            </div>

            <div className="pt-2 z-10">
              <Link
                href="/chats"
                className="text-xs font-extrabold text-white/90 hover:text-white flex items-center space-x-1 transition-all"
              >
                <span>See full analytics</span>
                <span>→</span>
              </Link>
            </div>

            {/* Decorative background glow */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
          </div>

          {/* Card 2: Sales Overview Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Sales Overview
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                This month ▾
              </span>
            </div>

            <div>
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-black text-slate-900 tracking-tight">$ 842,530</span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <span>▲</span>
                  <span>15.4%</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">12% of annual target</p>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-violet-600 h-2 rounded-full w-[65%]"></div>
              </div>
            </div>

            {/* Region Chips */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-2 text-center">
                <div className="text-[10px] text-slate-400 font-bold">Finland</div>
                <div className="text-xs font-extrabold text-purple-700">28%</div>
              </div>
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-2 text-center">
                <div className="text-[10px] text-slate-400 font-bold">Sweden</div>
                <div className="text-xs font-extrabold text-blue-700">24%</div>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-2 text-center">
                <div className="text-[10px] text-slate-400 font-bold">Iceland</div>
                <div className="text-xs font-extrabold text-emerald-700">18%</div>
              </div>
              <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-2 text-center">
                <div className="text-[10px] text-slate-400 font-bold">Estonia</div>
                <div className="text-xs font-extrabold text-amber-700">14%</div>
              </div>
            </div>
          </div>

          {/* Card 3: AI Engine Status Banner (Nexora Middle Column Banner) */}
          <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                WhatsApp Assistant
              </span>
              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                <span>Live</span>
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">AI Vehicle on the road</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                Real-time tracking & automated customer responses in one place.
              </p>
            </div>

            <Link
              href="/whatsapp"
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-5 rounded-2xl transition-all inline-flex items-center justify-between shadow-md"
            >
              <span>Track WhatsApp AI</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Operational Performance Chips (Nexora Pastel Grid) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Fleet Performance Overview
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-bold">Utilization</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">78%</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">▲ 5%</div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
                ⚙️
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-bold">Fuel Efficiency</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">8.7 mpg</div>
                <div className="text-[10px] text-blue-600 font-bold mt-0.5">▲ 2%</div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
                ⛽
              </div>
            </div>

            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-bold">On-Time Rate</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">92%</div>
                <div className="text-[10px] text-purple-600 font-bold mt-0.5">▲ 11%</div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg font-bold">
                ⏱️
              </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-bold">Idle Time</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">1h 12m</div>
                <div className="text-[10px] text-amber-600 font-bold mt-0.5">▼ 4%</div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold">
                ⌛
              </div>
            </div>
          </div>
        </div>

        {/* Orders & Activity List Card (Matching Nexora Column 3 Layout) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Orders</h2>
                <span className="text-xs text-slate-400 font-bold">364</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Customer order assignments & AI routing.</p>
            </div>

            {/* Filter Tabs matching Nexora pills */}
            <div className="flex items-center space-x-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 text-xs font-bold">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'all'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All 264
              </button>
              <button
                onClick={() => setActiveTab('unassigned')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'unassigned'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Unassigned 85
              </button>
              <button
                onClick={() => setActiveTab('assigned')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'assigned'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Assigned 53
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'completed'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Completed 56
              </button>
            </div>
          </div>

          {/* Cards Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-50/60 border border-slate-100 rounded-3xl p-5 space-y-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Order ID</span>
                  <span className={`text-[10px] font-extrabold px-3 py-0.5 rounded-full border ${order.statusColor}`}>
                    {order.status}
                  </span>
                </div>

                <div className="text-base font-black text-slate-900 tracking-tight font-mono">
                  {order.id}
                </div>

                <div className="space-y-2 text-xs border-t border-slate-200/60 pt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Route</span>
                    <span className="font-bold text-slate-800">{order.customer}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vehicle / Agent</span>
                    <span className="font-bold text-slate-800">{order.agent}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Est. Delivery</span>
                    <span className="font-bold text-slate-800">{order.date}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                  <Link
                    href="/orders"
                    className="text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors"
                  >
                    View Details
                  </Link>
                  <button className="text-slate-400 hover:text-slate-600 text-xs font-bold">•••</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClientLayoutShell>
  );
}
