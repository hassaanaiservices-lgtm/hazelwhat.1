'use client';

import { useState, useEffect } from 'react';
import ClientLayoutShell from '@/components/ClientLayoutShell';

interface FollowUpRule {
  id: string;
  stepNumber: number;
  title: string;
  waitValue: number;
  waitUnit: 'Minutes' | 'Hours' | 'Days' | 'Months';
  enabled: boolean;
}

export default function FollowUpsManagementPage() {
  const [rules, setRules] = useState<FollowUpRule[]>([
    { id: 'rule-1', stepNumber: 1, title: 'Follow-up 1', waitValue: 1, waitUnit: 'Hours', enabled: true },
    { id: 'rule-2', stepNumber: 2, title: 'Follow-up 2', waitValue: 1, waitUnit: 'Days', enabled: true },
    { id: 'rule-3', stepNumber: 3, title: 'Follow-up 3', waitValue: 2, waitUnit: 'Days', enabled: true },
    { id: 'rule-4', stepNumber: 4, title: 'Follow-up 4', waitValue: 3, waitUnit: 'Days', enabled: true },
    { id: 'rule-5', stepNumber: 5, title: 'Follow-up 5', waitValue: 5, waitUnit: 'Days', enabled: true },
  ]);

  const [toastMessage, setToastMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWaitValue, setNewWaitValue] = useState(7);
  const [newWaitUnit, setNewWaitUnit] = useState<'Minutes' | 'Hours' | 'Days' | 'Months'>('Days');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleAddRule = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nextStepNumber = rules.length + 1;
    const created: FollowUpRule = {
      id: `rule-${Date.now()}`,
      stepNumber: nextStepNumber,
      title: `Follow-up ${nextStepNumber}`,
      waitValue: newWaitValue,
      waitUnit: newWaitUnit,
      enabled: true,
    };
    setRules((prev) => [...prev, created]);
    setShowAddModal(false);
    showToast(`Added Follow-up ${nextStepNumber} rule (${newWaitValue} ${newWaitUnit})`);
  };

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleUpdateWaitValue = (id: string, val: number) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, waitValue: Math.max(1, val) } : r))
    );
  };

  const handleUpdateWaitUnit = (id: string, unit: 'Minutes' | 'Hours' | 'Days' | 'Months') => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, waitUnit: unit } : r))
    );
  };

  const handleDeleteRule = (id: string) => {
    if (rules.length <= 1) {
      showToast('At least one follow-up sequence rule is required.');
      return;
    }
    const filtered = rules.filter((r) => r.id !== id);
    const renumbered = filtered.map((r, idx) => ({
      ...r,
      stepNumber: idx + 1,
      title: `Follow-up ${idx + 1}`,
    }));
    setRules(renumbered);
    showToast('Follow-up rule removed');
  };

  const handleSaveSettings = () => {
    showToast('💾 Automated Follow-up Sequence Settings saved successfully!');
  };

  return (
    <ClientLayoutShell>
      <div className="space-y-6 max-w-5xl font-sans antialiased pb-16">
        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-bounce">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Title & Save Settings Bar matching screenshot */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-violet-600 font-black text-2xl">🕒</span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Follow Ups
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Configure automated follow-up sequence rules & intervals for un-replied leads.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold px-4 py-2.5 rounded-2xl text-xs border border-purple-200 transition-all flex items-center space-x-1.5 shadow-2xs"
            >
              <span>+</span>
              <span>Add Follow-Up</span>
            </button>

            <button
              onClick={handleSaveSettings}
              className="bg-violet-600 hover:bg-violet-700 text-white font-black px-6 py-2.5 rounded-2xl text-xs shadow-md shadow-violet-200 transition-all flex items-center space-x-2"
            >
              <span>💾</span>
              <span>Save Settings</span>
            </button>
          </div>
        </div>

        {/* Main Automation Sequence Container matching screenshot */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                AUTOMATED FOLLOW-UP SEQUENCE RULES
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                Sends automated follow-up reminders to un-replied leads every N minutes, hours, days, or months. Smart AI automatically skips follow-ups if the customer completes the booking or order.
              </p>
            </div>
            <div className="bg-purple-50 text-purple-700 font-bold text-[11px] px-3 py-1.5 rounded-xl border border-purple-200 shrink-0 self-start sm:self-auto">
              ⚡ Sequential Logic: Each step waits relative to previous step
            </div>
          </div>

          {/* Sequence List */}
          <div className="space-y-4">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                className={`border rounded-3xl p-5 space-y-3 transition-all ${
                  rule.enabled
                    ? 'bg-white border-purple-100/90 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200/60 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-full bg-violet-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {rule.stepNumber}
                    </span>
                    <div>
                      <span className="font-black text-slate-900 text-sm block">{rule.title}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {idx === 0 ? 'Triggers after last customer msg' : `Triggers after ${rules[idx - 1].title}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-1.5">
                      <span className="text-xs font-bold text-slate-400">Wait</span>
                      <input
                        type="number"
                        min={1}
                        value={rule.waitValue}
                        onChange={(e) => handleUpdateWaitValue(rule.id, parseInt(e.target.value) || 1)}
                        className="w-12 bg-white border border-slate-200 rounded-xl text-center text-xs font-black text-slate-900 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                      <select
                        value={rule.waitUnit}
                        onChange={(e) =>
                          handleUpdateWaitUnit(
                            rule.id,
                            e.target.value as 'Minutes' | 'Hours' | 'Days' | 'Months'
                          )
                        }
                        className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="Minutes">Minutes</option>
                        <option value="Hours">Hours</option>
                        <option value="Days">Days</option>
                        <option value="Months">Months</option>
                      </select>
                    </div>

                    {/* Toggle Switch matching purple design */}
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.enabled ? 'bg-violet-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          rule.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Prominent Delete Rule button */}
                    {rules.length > 1 && (
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-black text-xs flex items-center justify-center border border-slate-200/80 transition-all shadow-2xs"
                        title="Remove follow-up rule"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-text badge box matching screenshot */}
                <div className="bg-purple-50/50 border border-purple-100/70 rounded-2xl p-3 flex items-center space-x-2 text-xs font-medium text-purple-900/80">
                  <span className="text-violet-600 shrink-0">✨</span>
                  <p className="leading-relaxed text-[11px]">
                    AI dynamically generates context-aware follow-up messages based on recent chat history (e.g. specific product inquired). Smart intelligence automatically skips follow-ups if the deal or booking is already completed.
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-extrabold px-6 py-3 rounded-2xl text-xs border border-slate-200/80 hover:border-purple-200 transition-all flex items-center space-x-2"
            >
              <span>+</span>
              <span>Add Another Follow-Up Step</span>
            </button>
          </div>
        </div>

        {/* Modal: Add Follow-Up Rule */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-violet-600 text-base">🕒</span>
                  <h3 className="font-black text-sm text-slate-900">Add Follow-Up Sequence Step</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddRule} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Wait Interval
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newWaitValue}
                      onChange={(e) => setNewWaitValue(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Time Unit
                    </label>
                    <select
                      value={newWaitUnit}
                      onChange={(e) =>
                        setNewWaitUnit(
                          e.target.value as 'Minutes' | 'Hours' | 'Days' | 'Months'
                        )
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none"
                    >
                      <option value="Minutes">Minutes</option>
                      <option value="Hours">Hours</option>
                      <option value="Days">Days</option>
                      <option value="Months">Months</option>
                    </select>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3 text-[11px] text-purple-900 font-medium">
                  💡 This step will trigger <b>{newWaitValue} {newWaitUnit}</b> after the preceding follow-up if the customer remains un-replied.
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-black text-white bg-violet-600 shadow-md shadow-violet-200"
                  >
                    Create Follow-up Step
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ClientLayoutShell>
  );
}
