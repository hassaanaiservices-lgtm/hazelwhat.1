'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();

  // If on login page, don't show sidebar
  if (pathname === '/admin/login') {
    return null;
  }

  const mainNav = [
    {
      name: 'Overview',
      href: '/admin',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      name: 'Clients',
      href: '/admin/clients',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: 'System Health',
      href: '/admin/system',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: 'Billing',
      href: '/admin/billing',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const team = [
    { name: 'Faiza Lira (You)', avatar: '👩🏻‍💼', status: 'online' },
    { name: 'Dianne Russell', avatar: '👩🏽‍💻', status: 'online' },
    { name: 'Ralph Edwards', avatar: '👨🏼‍💻', status: 'away' },
    { name: 'Annette Black', avatar: '👩🏻‍🔬', status: 'offline' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-5 min-h-screen shrink-0 font-sans shadow-xs">
      <div className="space-y-6">
        {/* Top Header Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm shadow-violet-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight block leading-none">HazelWhat</span>
              <span className="text-[10px] uppercase font-bold text-violet-600 tracking-wider">Admin Platform</span>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all"
          />
        </div>

        {/* Main Section */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Main</div>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-violet-50 text-violet-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-violet-600' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Team Section */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Team</div>
          <div className="space-y-1">
            {team.map((member) => (
              <div
                key={member.name}
                className="flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="relative text-base">
                  <span>{member.avatar}</span>
                  <span
                    className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                      member.status === 'online'
                        ? 'bg-emerald-500'
                        : member.status === 'away'
                        ? 'bg-amber-500'
                        : 'bg-slate-300'
                    }`}
                  />
                </div>
                <span className="truncate">{member.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        {/* Promotional / Status Card (Matching DashMark gradient box) */}
        <div className="bg-gradient-to-br from-violet-100/70 via-indigo-50/50 to-pink-100/50 border border-violet-100/80 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">👑</span>
            <span className="text-xs font-bold text-violet-900">Platform Status</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug mb-3">
            Multi-Tenant WhatsApp AI engine running smoothly.
          </p>
          <div className="inline-flex items-center text-xs font-bold text-violet-700 hover:text-violet-900 cursor-pointer">
            100% Operational →
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-800 flex items-center justify-center font-bold text-xs border border-violet-200">
              FA
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 truncate">Faiza Lira</div>
              <div className="text-[10px] text-slate-400 truncate">lira@gmail.com</div>
            </div>
          </div>
          <button
            onClick={() => {
              document.cookie = 'hazelwhat_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              window.location.href = '/admin/login';
            }}
            className="text-slate-400 hover:text-red-500 p-1.5 transition-colors"
            title="Log Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
