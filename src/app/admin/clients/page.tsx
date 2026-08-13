'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminClientsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/tenants');
      const data = await res.json();
      if (data.tenants) {
        setTenants(data.tenants);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create client');
      }

      setName('');
      setSlug('');
      setShowModal(false);
      showToast('New client provisioned successfully!');
      fetchTenants();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete client account "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete tenant');
      showToast(`Client "${name}" has been deleted.`);
      fetchTenants();
    } catch (err: any) {
      showToast(err.message || 'Error deleting tenant');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyCredentials = (t: any) => {
    const username = t.client_username || `${t.slug}_255`;
    const password = t.client_password || 'Pass_8829!';
    const credText = `Client: ${t.name}\nUsername: ${username}\nPassword: ${password}\nLogin URL: http://localhost:3000/client/login`;
    navigator.clipboard.writeText(credText);
    showToast(`Copied portal login credentials for ${t.name}!`);
  };

  const getCurrencySymbol = (curr?: string) => {
    switch (curr) {
      case 'PKR': return 'Rs';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'AED': return 'AED';
      case 'SAR': return 'SAR';
      default: return 'Rs';
    }
  };

  return (
    <div className="space-y-6 font-sans antialiased">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Onboarded Clients</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage, edit, or delete platform tenant subscriptions.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md shadow-violet-200 transition-all flex items-center space-x-1.5"
        >
          <span>+ Create New Client</span>
        </button>
      </div>

      {/* Client Directory Card matching User Screenshot */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
        {/* Card Header Title */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Client Directory & Account Identifiers
            </h2>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">
              Select any client below to manage setup, API keys, and business details.
            </p>
          </div>

          <div className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600 bg-violet-50 px-3.5 py-1.5 rounded-full border border-violet-100">
            SHOWING {tenants.length} CLIENTS
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-extrabold">CLIENT #</th>
                <th className="px-6 py-4 font-extrabold">CLIENT CONTACT</th>
                <th className="px-6 py-4 font-extrabold">BUSINESS NAME</th>
                <th className="px-6 py-4 font-extrabold">PORTAL LOGIN USER</th>
                <th className="px-6 py-4 font-extrabold">SETUP / MONTHLY PACKAGE</th>
                <th className="px-6 py-4 font-extrabold">STATUS</th>
                <th className="px-6 py-4 font-extrabold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading client directory...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No onboarded clients found. Click "+ Create New Client" above.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => {
                  const instFee = t.installation_fee !== undefined ? t.installation_fee : 50000;
                  const monthFee = t.monthly_fee !== undefined ? t.monthly_fee : 15000;
                  const symbol = getCurrencySymbol(t.currency);
                  const username = t.client_username || `${t.slug}_255`;
                  const statusLabel = t.status === 'draft' ? 'DRAFT' : t.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* CLIENT # */}
                      <td className="px-6 py-4 font-extrabold text-violet-600 text-xs">
                        #{t.slug || '1001'}
                      </td>

                      {/* CLIENT CONTACT */}
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900 text-xs">{t.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium flex items-center space-x-1 mt-0.5">
                          <span>📞</span>
                          <span>0986434567</span>
                        </div>
                      </td>

                      {/* BUSINESS NAME */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-xs">{t.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          client@business.com
                        </div>
                      </td>

                      {/* PORTAL LOGIN USER */}
                      <td className="px-6 py-4 font-extrabold text-slate-900 font-mono text-xs">
                        {username}
                      </td>

                      {/* SETUP / MONTHLY PACKAGE */}
                      <td className="px-6 py-4 font-extrabold text-slate-900 text-xs">
                        <span className="text-violet-700">
                          {symbol} {instFee.toLocaleString()}
                        </span>{' '}
                        <span className="text-slate-400 font-normal">/</span>{' '}
                        <span className="text-violet-600">
                          {symbol} {monthFee.toLocaleString()}/mo
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                            t.status === 'active' || !t.status
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : t.status === 'draft'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          <span>{t.status === 'draft' ? '📋' : t.status === 'suspended' ? '🔴' : '🟢'}</span>
                          <span>{statusLabel}</span>
                        </span>
                      </td>

                      {/* ACTIONS: Manage Setup, Credentials Lock Icon, Delete Trash Icon */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          {/* 1. Manage Setup Button */}
                          <Link
                            href={`/admin/clients/${t.id}`}
                            className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold px-3.5 py-2 rounded-2xl text-xs shadow-xs shadow-violet-200 transition-all flex items-center space-x-1.5 shrink-0"
                          >
                            <span>📝</span>
                            <span>Manage Setup</span>
                          </Link>

                          {/* 2. Lock Credentials Button */}
                          <button
                            onClick={() => handleCopyCredentials(t)}
                            title="Copy Login Credentials"
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 p-2 rounded-2xl transition-all shadow-2xs"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </button>

                          {/* 3. Delete Trash Button */}
                          <button
                            onClick={() => handleDeleteClient(t.id, t.name)}
                            disabled={deletingId === t.id}
                            title="Delete Client Account"
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 p-2 rounded-2xl transition-all shadow-2xs disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Client Creation */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Create New Tenant Client</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                  }}
                  placeholder="e.g. Acme Salon"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tenant Slug ID</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. acme-salon"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="bg-violet-50/70 border border-violet-100 rounded-2xl p-3 text-xs text-violet-900">
                <span className="font-bold block mb-0.5">Automated AI Engine Pipeline:</span>
                DeepSeek (Primary) → ChatGPT (Fallback) automatically configured on backend.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-2xl shadow-xs shadow-violet-200 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating Tenant...' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
