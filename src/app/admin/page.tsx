import { getAllTenantsForAdmin } from '@/lib/db';
import Link from 'next/link';

export default async function AdminOverviewPage() {
  let tenants: any[] = [];
  try {
    tenants = await getAllTenantsForAdmin({ isAdmin: true });
  } catch (err) {
    // Empty list if db unpopulated
  }

  const activeTenants = tenants.filter((t) => t.status === 'active').length;
  const inactiveTenants = tenants.filter((t) => t.status === 'inactive').length;
  const trialTenants = tenants.filter((t) => t.subscription_status === 'trial').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Row: Total Revenue / Volume Bar Chart & Leads Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Total Revenue / Volume */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Total Volume & Revenue</h2>
            <div className="flex items-center space-x-2">
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bar Chart Bars Visualization (Matching DashMark aesthetic) */}
          <div className="h-36 flex items-end justify-between px-2 pt-4 border-b border-slate-50 pb-3">
            {[
              { month: 'Jan', height: 'h-16', active: false },
              { month: 'Feb', height: 'h-24', active: false },
              { month: 'Mar', height: 'h-20', active: false },
              { month: 'Apr', height: 'h-32', active: true },
              { month: 'May', height: 'h-24', active: false },
              { month: 'Jun', height: 'h-28', active: false },
            ].map((bar) => (
              <div key={bar.month} className="flex flex-col items-center space-y-2">
                <div className="w-7 h-28 flex items-end justify-center rounded-lg bg-slate-50">
                  <div
                    className={`w-3.5 rounded-full transition-all ${
                      bar.active
                        ? 'bg-gradient-to-t from-violet-600 via-indigo-500 to-pink-400 shadow-md shadow-violet-200'
                        : 'bg-violet-200/60'
                    } ${bar.height}`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-400">{bar.month}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400">April 2026 Total</div>
            <div className="flex items-baseline space-x-3 mt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">$ 23,000.00</span>
              <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                45% ↗
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: All Leads & AI Operations Line Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">All Client Leads & Operations</h2>
            <div className="flex items-center space-x-3 text-slate-400 text-xs font-medium">
              <span className="flex items-center space-x-1 hover:text-slate-600 cursor-pointer">
                <span>📅</span>
                <span>This Week</span>
              </span>
              <span>📄</span>
            </div>
          </div>

          {/* Line Chart Wave Area with Floating Tooltip (Matching DashMark mockup) */}
          <div className="relative h-36 w-full flex flex-col justify-center">
            {/* SVG Waves */}
            <svg className="w-full h-28" viewBox="0 0 500 100" preserveAspectRatio="none">
              {/* Blue / Purple Primary Line */}
              <path
                d="M 0 20 Q 70 10 140 60 T 280 20 T 420 30 T 500 20"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
              />
              {/* Orange / Amber Secondary Line */}
              <path
                d="M 0 50 Q 70 45 140 80 T 280 65 T 420 70 T 500 55"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
              />
            </svg>

            {/* Floating Tooltip Box (Matching DashMark screenshot) */}
            <div className="absolute right-28 top-2 bg-white/95 backdrop-blur-xs border border-slate-100 shadow-xl rounded-xl p-2.5 space-y-1 z-10 text-[11px]">
              <div className="flex items-center justify-between space-x-4">
                <span className="font-semibold text-slate-500">Leads</span>
                <span className="font-extrabold text-slate-900">43</span>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded">12% ↗</span>
              </div>
              <div className="flex items-center justify-between space-x-4 border-t border-slate-100 pt-1">
                <span className="font-semibold text-slate-500">Target</span>
                <span className="font-extrabold text-slate-900">123</span>
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded">50% ◐</span>
              </div>
            </div>

            {/* X Axis Dates */}
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 pt-2 px-1">
              <span>Sep 12</span>
              <span>Sep 13</span>
              <span>Sep 14</span>
              <span>Sep 15</span>
              <span>Sep 16</span>
              <span>Sep 17</span>
              <span>Sep 18</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <div>
              <div className="text-[11px] font-bold text-slate-400">Total Leads</div>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">124</span>
                <span className="text-xs font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">55% ↗</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400">Target Leads</div>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">500</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">23% completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: 4 Metric Cards (Matching DashMark middle pills) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Sales / Tenants */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-xs">🏷️</span>
              <span className="text-xs font-bold text-slate-800">Total Tenants</span>
            </div>
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">7.3% ↗</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{tenants.length} Tenants</span>
            <span className="text-xs font-bold text-slate-400">30D</span>
          </div>
        </div>

        {/* Card 2: Active Clients */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">✓</span>
              <span className="text-xs font-bold text-slate-800">Active Clients</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">44% ↗</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{activeTenants} Active</span>
            <span className="text-xs font-bold text-slate-400">30D</span>
          </div>
        </div>

        {/* Card 3: Paused / Inactive */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">⏸️</span>
              <span className="text-xs font-bold text-slate-800">Paused / Inactive</span>
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">34% ↘</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{inactiveTenants} Records</span>
            <span className="text-xs font-bold text-slate-400">30D</span>
          </div>
        </div>

        {/* Card 4: On Trial */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">✉️</span>
              <span className="text-xs font-bold text-slate-800">Trial Subscriptions</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">65% ↗</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{trialTenants} On Trial</span>
            <span className="text-xs font-bold text-slate-400">30D</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Activity & Schedule Grid Table (Matching DashMark bottom section) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-6">
        {/* Table Top Controls & Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-6 text-xs font-bold">
            <button className="text-violet-700 border-b-2 border-violet-600 pb-4 -mb-4">All Tasks</button>
            <button className="text-slate-400 hover:text-slate-700 transition-colors pb-4 -mb-4">Design Standup</button>
            <button className="text-slate-400 hover:text-slate-700 transition-colors pb-4 -mb-4">Dev handoff</button>
            <button className="text-slate-400 hover:text-slate-700 transition-colors pb-4 -mb-4">Client Meetings</button>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button className="text-slate-500 font-medium hover:text-slate-800">Filter</button>
            <button className="text-slate-500 font-medium hover:text-slate-800">Sort</button>
            <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:text-slate-600">🔍</button>
            
            <Link
              href="/admin/clients"
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1 shadow-sm shadow-violet-200 transition-all"
            >
              <span>+ Create</span>
              <span>v</span>
            </Link>
          </div>
        </div>

        {/* Calendar Day Matrix Schedule Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[650px] space-y-3">
            {/* Headers */}
            <div className="grid grid-cols-6 text-[11px] font-bold text-slate-400 border-b border-slate-50 pb-2">
              <span className="text-slate-300">GMT+5</span>
              <span>26 Mon</span>
              <span>27 Tue</span>
              <span>28 Wed</span>
              <span>29 Thu</span>
              <span>30 Fri</span>
            </div>

            {/* Time Slot Row 1 (1 am) */}
            <div className="grid grid-cols-6 items-center text-xs py-1">
              <span className="text-[11px] font-semibold text-slate-400">1 am</span>
              <div className="col-span-1 pr-2">
                <div className="bg-gradient-to-r from-violet-100 to-indigo-100 border border-violet-200/80 rounded-xl px-3 py-2 text-violet-900 font-bold text-xs shadow-2xs">
                  Design Standup
                </div>
              </div>
              <div />
              <div className="col-span-1 pr-2">
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 text-amber-900 font-bold text-xs shadow-2xs">
                  Client meeting
                </div>
              </div>
              <div />
              <div className="col-span-1">
                <div className="bg-sky-50 border border-sky-200/80 rounded-xl px-3 py-2 text-sky-900 font-bold text-xs shadow-2xs">
                  Dev handoff
                </div>
              </div>
            </div>

            {/* Time Slot Row 2 (2 am) */}
            <div className="grid grid-cols-6 items-center text-xs py-1">
              <span className="text-[11px] font-semibold text-slate-400">2 am</span>
              <div />
              <div className="col-span-1 pr-2">
                <div className="bg-sky-50 border border-sky-200/80 rounded-xl px-3 py-2 text-sky-900 font-bold text-xs shadow-2xs">
                  Dev handoff
                </div>
              </div>
              <div />
              <div className="col-span-1 pr-2">
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 text-amber-900 font-bold text-xs shadow-2xs">
                  Client meeting
                </div>
              </div>
              <div className="col-span-1">
                <div className="bg-gradient-to-r from-violet-100 to-indigo-100 border border-violet-200/80 rounded-xl px-3 py-2 text-violet-900 font-bold text-xs shadow-2xs">
                  Design Standup
                </div>
              </div>
            </div>

            {/* Time Slot Row 3 (3 am) */}
            <div className="grid grid-cols-6 items-center text-xs py-1">
              <span className="text-[11px] font-semibold text-slate-400">3 am</span>
              <div />
              <div />
              <div className="col-span-1 pr-2">
                <div className="bg-gradient-to-r from-violet-100 to-pink-100 border border-violet-200/80 rounded-xl px-3 py-2 text-violet-900 font-bold text-xs shadow-2xs">
                  Design Standup
                </div>
              </div>
              <div />
              <div />
            </div>

            {/* Time Slot Row 4 (4 am) */}
            <div className="grid grid-cols-6 items-center text-xs py-1">
              <span className="text-[11px] font-semibold text-slate-400">4 am</span>
              <div />
              <div className="col-span-1 pr-2">
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 text-amber-900 font-bold text-xs shadow-2xs">
                  Client meeting
                </div>
              </div>
              <div />
              <div />
              <div className="col-span-1">
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 text-amber-900 font-bold text-xs shadow-2xs">
                  Client meeting
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
