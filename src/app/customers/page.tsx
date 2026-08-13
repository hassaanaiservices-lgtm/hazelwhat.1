'use client';

import { useState } from 'react';
import ClientLayoutShell from '@/components/ClientLayoutShell';
import Link from 'next/link';

interface Lead {
  id: string;
  name: string;
  phone: string;
  stage: 'new' | 'qualified' | 'warm' | 'cold' | 'completed';
  tag: string;
  lastMessage: string;
  value: number;
  updatedAt: string;
  followUpCount?: number;
}

export default function ClientCustomersPage() {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Sample leads reflecting the user's exact audio rules
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 'lead-1',
      name: 'Usman Tariq',
      phone: '0301-1122334',
      stage: 'new',
      tag: '💬 1 Message Sent',
      lastMessage: 'Hi, what are your packages and rates?',
      value: 5000,
      updatedAt: '10 mins ago',
      followUpCount: 0,
    },
    {
      id: 'lead-2',
      name: 'Farhan Ahmed',
      phone: '0300-1234567',
      stage: 'qualified',
      tag: '🛒 Order #ORD-9482',
      lastMessage: 'Silk Facial Treatment Kit (x2) Confirmed',
      value: 15000,
      updatedAt: '1 hour ago',
      followUpCount: 0,
    },
    {
      id: 'lead-3',
      name: 'Ayesha Khan',
      phone: '0312-9876543',
      stage: 'qualified',
      tag: '📅 Appointment #APT-3021',
      lastMessage: 'VIP Hair Styling & Consultation Booked',
      value: 8500,
      updatedAt: '2 hours ago',
      followUpCount: 0,
    },
    {
      id: 'lead-4',
      name: 'Zubair Malik',
      phone: '0321-4567890',
      stage: 'warm',
      tag: '🔥 4 Conversation Messages',
      lastMessage: 'Discussed Lahore delivery charges and product details.',
      value: 12000,
      updatedAt: 'Yesterday',
      followUpCount: 2,
    },
    {
      id: 'lead-5',
      name: 'Bilal Raza',
      phone: '0345-9988776',
      stage: 'cold',
      tag: '⚠️ 7 Unanswered Follow-ups',
      lastMessage: 'No response after 7 automated WhatsApp reminders.',
      value: 4500,
      updatedAt: '3 days ago',
      followUpCount: 7,
    },
    {
      id: 'lead-6',
      name: 'Hamza Sheikh',
      phone: '0302-8877665',
      stage: 'completed',
      tag: '✓ Delivered & Paid',
      lastMessage: 'Order delivered via courier. Customer satisfied.',
      value: 18000,
      updatedAt: '4 days ago',
      followUpCount: 0,
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleMoveStage = (leadId: string, newStage: Lead['stage']) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
    );
    const stageNames = {
      new: 'New Leads',
      qualified: 'Qualified',
      warm: 'Warm Leads',
      cold: 'Cold Leads',
      completed: 'Completed',
    };
    showToast(`Moved lead to ${stageNames[newStage]}`);
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery)
  );

  const getLeadsByStage = (stage: Lead['stage']) =>
    filteredLeads.filter((l) => l.stage === stage);

  const columns: { id: Lead['stage']; title: string; colorDot: string }[] = [
    { id: 'new', title: 'New Leads', colorDot: 'bg-blue-500' },
    { id: 'qualified', title: 'Qualified', colorDot: 'bg-amber-500' },
    { id: 'warm', title: 'Warm Leads', colorDot: 'bg-purple-500' },
    { id: 'cold', title: 'Cold Leads', colorDot: 'bg-slate-400' },
    { id: 'completed', title: 'Completed', colorDot: 'bg-emerald-500' },
  ];

  return (
    <ClientLayoutShell>
      <div className="space-y-6 max-w-7xl font-sans antialiased">
        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-bounce">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Card matching Screenshot */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="text-violet-600 font-black text-2xl">👥</span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Pipeline & Lead Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-semibold pl-9">
              Nurture and manage your WhatsApp leads through the sales pipeline.
            </p>
          </div>

          {/* View Mode Toggle Pill matching screenshot */}
          <div className="bg-slate-100/80 p-1 rounded-2xl flex items-center space-x-1 border border-slate-200/60 shrink-0">
            <button
              onClick={() => setViewMode('board')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${
                viewMode === 'board'
                  ? 'bg-white text-purple-700 shadow-2xs border border-purple-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>⚡</span>
              <span>Board View</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${
                viewMode === 'list'
                  ? 'bg-white text-purple-700 shadow-2xs border border-purple-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📋</span>
              <span>List View</span>
            </button>
          </div>
        </div>

        {/* Search Bar matching screenshot */}
        <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name or phone..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium"
            />
            <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          <div className="text-xs font-black text-slate-500">
            Total: <span className="text-violet-700 font-extrabold">{filteredLeads.length} Active Leads</span>
          </div>
        </div>

        {/* BOARD VIEW (Kanban Columns matching Screenshot) */}
        {viewMode === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {columns.map((col) => {
              const colLeads = getLeadsByStage(col.id);

              return (
                <div
                  key={col.id}
                  className="bg-slate-50/70 border border-slate-200/70 rounded-3xl p-3.5 flex flex-col min-h-[480px]"
                >
                  {/* Column Header matching screenshot */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center justify-between mb-3 shadow-2xs">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.colorDot}`}></span>
                      <h3 className="font-extrabold text-xs text-slate-900">{col.title}</h3>
                    </div>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Leads List inside Column */}
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {colLeads.length === 0 ? (
                      <div className="h-32 border-2 border-dashed border-slate-200/80 rounded-2xl flex items-center justify-center text-[11px] font-bold text-slate-400">
                        No leads
                      </div>
                    ) : (
                      colLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="bg-white border border-slate-100 hover:border-violet-300 rounded-2xl p-4 shadow-2xs space-y-2.5 transition-all hover:shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-slate-900 truncate">
                              {lead.name}
                            </span>
                            <span className="text-[10px] font-mono font-extrabold text-violet-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                              Rs {lead.value.toLocaleString()}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 font-mono font-medium">
                            📞 {lead.phone}
                          </div>

                          {/* Rule Badge matching Audio Logic */}
                          <div className="text-[10px] font-bold text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-xl border border-slate-200/60 line-clamp-1">
                            {lead.tag}
                          </div>

                          <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                            "{lead.lastMessage}"
                          </p>

                          {/* Bottom Card Actions */}
                          <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                            {/* Move Stage Selector */}
                            <select
                              value={lead.stage}
                              onChange={(e) =>
                                handleMoveStage(lead.id, e.target.value as Lead['stage'])
                              }
                              className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-[10px] font-extrabold text-slate-700 focus:outline-none focus:border-violet-500"
                            >
                              <option value="new">Move: New Lead</option>
                              <option value="warm">Move: Warm Lead</option>
                              <option value="qualified">Move: Qualified</option>
                              <option value="cold">Move: Cold Lead</option>
                              <option value="completed">Move: Completed</option>
                            </select>

                            <Link
                              href="/chats"
                              className="text-[11px] font-bold text-violet-600 hover:text-violet-800 transition-colors"
                            >
                              Chat →
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Lead Name</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Pipeline Stage</th>
                  <th className="pb-3">Logic Trigger</th>
                  <th className="pb-3">Est. Value</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 font-semibold">
                    <td className="py-3.5 font-bold text-slate-900">{lead.name}</td>
                    <td className="py-3.5 font-mono text-slate-600">{lead.phone}</td>
                    <td className="py-3.5">
                      <span className="capitalize bg-purple-50 text-purple-700 font-extrabold px-3 py-1 rounded-full border border-purple-200 text-[10px]">
                        {lead.stage}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600">{lead.tag}</td>
                    <td className="py-3.5 font-bold text-violet-700 font-mono">
                      Rs {lead.value.toLocaleString()}
                    </td>
                    <td className="py-3.5 text-right">
                      <select
                        value={lead.stage}
                        onChange={(e) =>
                          handleMoveStage(lead.id, e.target.value as Lead['stage'])
                        }
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-[10px] font-extrabold text-slate-700 focus:outline-none"
                      >
                        <option value="new">New Lead</option>
                        <option value="warm">Warm Lead</option>
                        <option value="qualified">Qualified</option>
                        <option value="cold">Cold Lead</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ClientLayoutShell>
  );
}
