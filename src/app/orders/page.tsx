'use client';

import { useState, useEffect } from 'react';
import ClientLayoutShell from '@/components/ClientLayoutShell';

export default function ClientOrdersPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'orders' | 'appointments' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [toastMessage, setToastMessage] = useState('');
  const [ordersList, setOrdersList] = useState<any[]>([]);

  // 4 Default Dummy Orders & Appointments requested by user
  const initialDummyItems = [
    {
      id: 'ORD-9482',
      type: 'order',
      customerName: 'Farhan Ahmed',
      phone: '0300-1234567',
      title: 'Silk Facial Treatment Kit (x2)',
      amount: 15000,
      currency: 'Rs',
      status: 'Pending',
      date: 'Today, 2:45 PM',
    },
    {
      id: 'APT-3021',
      type: 'appointment',
      customerName: 'Ayesha Khan',
      phone: '0312-9876543',
      title: 'VIP Hair Styling & Consultation',
      amount: 8500,
      currency: 'Rs',
      status: 'Confirmed',
      date: 'Tomorrow at 3:00 PM',
    },
    {
      id: 'ORD-7193',
      type: 'order',
      customerName: 'Zubair Malik',
      phone: '0321-4567890',
      title: 'Organic Glow Serum (x1)',
      amount: 4200,
      currency: 'Rs',
      status: 'Confirmed',
      date: 'Today, 11:15 AM',
    },
    {
      id: 'APT-1084',
      type: 'appointment',
      customerName: 'Sara Ali',
      phone: '0333-7654321',
      title: 'Nail Spa & Pedicure Session',
      amount: 6000,
      currency: 'Rs',
      status: 'Cancelled',
      date: '15 Aug at 11:30 AM',
    },
  ];

  useEffect(() => {
    setOrdersList(initialDummyItems);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Web Audio Chime Sound Synthesizer (Sweet Bell Ping)
  const playSweetChimeSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Note 1: High Crystal Chime (E6 - 1318Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.51, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);

      // Note 2: Harmonic Sparkle (B6 - 1975Hz) delayed 0.12s
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1975.53, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.9);
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  };

  const handleTestSound = () => {
    playSweetChimeSound();
    showToast('🔔 Sweet Sound Played! Order alert chime active.');
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setOrdersList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    if (soundEnabled) playSweetChimeSound();
    showToast(`Updated status for #${id} to ${newStatus}`);
  };

  // Filter items based on active pill filter
  const filteredItems = ordersList.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'orders') return item.type === 'order';
    if (activeFilter === 'appointments') return item.type === 'appointment';
    if (activeFilter === 'pending') return item.status.toLowerCase() === 'pending';
    if (activeFilter === 'confirmed') return item.status.toLowerCase() === 'confirmed';
    if (activeFilter === 'cancelled') return item.status.toLowerCase() === 'cancelled';
    return true;
  });

  return (
    <ClientLayoutShell>
      <div className="space-y-6 max-w-6xl font-sans antialiased">
        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-bounce">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Card matching Screenshot */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-violet-600 font-black text-2xl">🛒</span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Incoming Orders & Projects
            </h1>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Sound Alert Toggle Pill */}
            <button
              onClick={() => {
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                showToast(`Order Sound Alert turned ${nextState ? 'ON' : 'OFF'}`);
              }}
              className="bg-purple-50/80 hover:bg-purple-100/80 text-purple-700 border border-purple-200 font-extrabold px-4 py-2 rounded-2xl text-xs transition-all shadow-2xs flex items-center space-x-1.5"
            >
              <span>{soundEnabled ? '🔊' : '🔇'}</span>
              <span>Order Sound Alert: {soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Test Sweet Sound Button */}
            <button
              onClick={handleTestSound}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-black px-4 py-2.5 rounded-2xl text-xs shadow-md shadow-violet-200 transition-all flex items-center space-x-1.5"
            >
              <span>🔔</span>
              <span>Test Sweet Sound 🔔</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Bar matching Screenshot */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-extrabold">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-2xl transition-all shadow-2xs whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Items
          </button>

          <button
            onClick={() => setActiveFilter('orders')}
            className={`px-4 py-2 rounded-2xl transition-all shadow-2xs whitespace-nowrap flex items-center space-x-1.5 ${
              activeFilter === 'orders'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>🛒</span>
            <span>Orders</span>
          </button>

          <button
            onClick={() => setActiveFilter('appointments')}
            className={`px-4 py-2 rounded-2xl transition-all shadow-2xs whitespace-nowrap flex items-center space-x-1.5 ${
              activeFilter === 'appointments'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>📅</span>
            <span>Appointments</span>
          </button>

          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-4 py-2 rounded-2xl transition-all shadow-2xs whitespace-nowrap ${
              activeFilter === 'pending'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Pending
          </button>

          <button
            onClick={() => setActiveFilter('confirmed')}
            className={`px-4 py-2 rounded-2xl transition-all shadow-2xs whitespace-nowrap ${
              activeFilter === 'confirmed'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Confirmed
          </button>

          <button
            onClick={() => setActiveFilter('cancelled')}
            className={`px-4 py-2 rounded-2xl transition-all shadow-2xs whitespace-nowrap ${
              activeFilter === 'cancelled'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Main Orders & Projects Container (Matching Screenshot Dashed Card Container) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs min-h-[350px]">
          {filteredItems.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
              <span className="text-slate-400 text-xs font-semibold">
                No orders or appointments found.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                SHOWING {filteredItems.length} ITEMS
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50/70 border border-slate-100 hover:border-violet-200 rounded-3xl p-5 space-y-3 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{item.type === 'order' ? '🛒' : '📅'}</span>
                        <span className="font-extrabold text-violet-600 font-mono text-xs">
                          #{item.id}
                        </span>
                        <span className="text-[10px] uppercase font-extrabold tracking-wider bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full">
                          {item.type}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          item.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : item.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        ● {item.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900 text-sm">{item.title}</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Customer: <span className="text-slate-800 font-bold">{item.customerName}</span> ({item.phone})
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Total Value
                        </span>
                        <span className="font-black text-violet-700 text-sm">
                          {item.currency} {item.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {item.status !== 'Confirmed' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'Confirmed')}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-3 py-1 rounded-xl text-xs transition-all"
                          >
                            Confirm ✓
                          </button>
                        )}
                        {item.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'Cancelled')}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold px-3 py-1 rounded-xl text-xs transition-all"
                          >
                            Cancel ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientLayoutShell>
  );
}
