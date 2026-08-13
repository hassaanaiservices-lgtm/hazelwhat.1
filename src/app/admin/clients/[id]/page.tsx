'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [allTenants, setAllTenants] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields matching screenshot
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'active' | 'draft' | 'suspended' | 'inactive'>('active');
  const [installationFee, setInstallationFee] = useState<number | string>(50000);
  const [monthlyFee, setMonthlyFee] = useState<number | string>(15000);
  const [currency, setCurrency] = useState('PKR');
  const [clientUsername, setClientUsername] = useState('');
  const [clientPassword, setClientPassword] = useState('');

  // Fetch list of all clients for dropdown selector
  const fetchAllTenants = async () => {
    try {
      const res = await fetch('/api/admin/tenants');
      const data = await res.json();
      if (data.tenants) setAllTenants(data.tenants);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/tenants/${id}`);
      if (!res.ok) throw new Error('Failed to load client details');
      const data = await res.json();
      setTenant(data.tenant);
      setConfig(data.config);

      setName(data.tenant.name || '');
      setStatus(data.tenant.status || 'active');
      setInstallationFee(data.tenant.installation_fee !== undefined ? data.tenant.installation_fee : 50000);
      setMonthlyFee(data.tenant.monthly_fee !== undefined ? data.tenant.monthly_fee : 15000);
      setCurrency(data.tenant.currency || 'PKR');
      
      const cleanSlug = (data.tenant.slug || 'client').toLowerCase().replace(/[^a-z0-9_]/g, '');
      setClientUsername(data.tenant.client_username || `${cleanSlug}_255`);
      setClientPassword(data.tenant.client_password || 'Pass_8829!');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTenants();
    fetchClientDetails();
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          status,
          installation_fee: Number(installationFee),
          monthly_fee: Number(monthlyFee),
          currency,
          client_username: clientUsername,
          client_password: clientPassword,
        }),
      });

      if (!res.ok) throw new Error('Save failed');

      showToast('Client setup saved successfully!');
      fetchClientDetails();
      fetchAllTenants();
    } catch (err: any) {
      showToast('Error updating client configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete account "${name}"? This action cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete tenant');
      router.push('/admin/clients');
    } catch (err: any) {
      showToast(err.message || 'Error deleting client');
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'PKR': return 'Rs';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'AED': return 'AED';
      case 'SAR': return 'SAR';
      default: return '$';
    }
  };

  if (loading) {
    return <div className="text-slate-400 py-12 text-center text-xs">Loading client configuration...</div>;
  }

  if (!tenant) {
    return <div className="text-red-500 py-12 text-center text-xs font-semibold">Client not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans antialiased pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar with Client Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/admin/clients"
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-2xl text-xs transition-all shadow-2xs flex items-center space-x-1.5"
        >
          <span>← Back to Client Directory</span>
        </Link>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Selected Client:</span>
          <select
            value={id}
            onChange={(e) => router.push(`/admin/clients/${e.target.value}`)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-2xs"
          >
            {allTenants.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.slug} - {t.name} ({t.status || 'active'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Client Header Card (Matching Screenshot Card 1) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-violet-200">
            #{tenant.slug?.slice(0, 4) || '1001'}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Client #{tenant.slug || '1001'}: {name}
              </h1>
              <span
                className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : status === 'draft'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                ● {status === 'active' ? 'Live Active' : status === 'draft' ? 'Draft Mode' : 'Suspended'}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              Business: <span className="text-slate-700 font-semibold">{name}</span> • Phone: 0986434567 • Assigned: +1 (555) 785-9355
            </p>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="relative">
            <select
              value={status}
              onChange={(e: any) => setStatus(e.target.value)}
              className="bg-white border border-violet-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-2xs cursor-pointer"
            >
              <option value="draft">📋 Draft Mode</option>
              <option value="active">🟢 Live Active</option>
              <option value="suspended">🔴 Suspended</option>
            </select>
          </div>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center space-x-1.5"
          >
            <span>🗑️</span>
            <span>{deleting ? 'Deleting...' : 'DELETE ACCOUNT'}</span>
          </button>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="bg-slate-200 hover:bg-violet-600 hover:text-white text-slate-700 font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-2xs transition-all disabled:opacity-50 flex items-center space-x-1.5"
          >
            <span>💾</span>
            <span>{saving ? 'Saving...' : 'SAVE CLIENT SETUP'}</span>
          </button>
        </div>
      </div>

      {/* Client Billing, Installation Fee & Monthly Package Setup Card (Matching Screenshot Card 2) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <span className="text-violet-600 font-bold text-base">$</span>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Client Billing, Installation Fee & Monthly Package Setup
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Installation Fee */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              INSTALLATION FEE (ONE-TIME SETUP)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-xs font-bold text-violet-600">
                {getCurrencySymbol(currency)}
              </span>
              <input
                type="number"
                value={installationFee}
                onChange={(e) => setInstallationFee(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                placeholder="50000"
              />
            </div>
          </div>

          {/* Monthly Subscription Package Fee */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              MONTHLY SUBSCRIPTION PACKAGE FEE
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-xs font-bold text-violet-600">
                {getCurrencySymbol(currency)}
              </span>
              <input
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                placeholder="15000"
              />
            </div>
          </div>

          {/* Billing Currency */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              BILLING CURRENCY
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
            >
              <option value="PKR">PKR - Pakistani Rupee (Rs)</option>
              <option value="USD">USD - US Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="GBP">GBP - British Pound (£)</option>
              <option value="AED">AED - UAE Dirham (AED)</option>
              <option value="SAR">SAR - Saudi Riyal (SAR)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client Portal Access Credentials Card (Matching Screenshot Card 3) */}
      <div className="bg-gradient-to-br from-violet-50/40 via-white to-purple-50/40 border border-violet-100 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-violet-100/80 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-violet-600 font-bold text-base">🔒</span>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Client Portal Access Credentials
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Generated login username and password for client portal dashboard access.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="bg-white border border-violet-200 hover:bg-violet-50 text-violet-700 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-2xs flex items-center space-x-1.5"
            >
              <span>{showPassword ? '🙈' : '👁️'}</span>
              <span>{showPassword ? 'Hide Password' : 'Show Password'}</span>
            </button>

            <button
              onClick={() =>
                copyToClipboard(
                  `Username: ${clientUsername}\nPassword: ${clientPassword}\nLogin URL: http://localhost:3000/client/login`,
                  'Both Credentials'
                )
              }
              className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-xs shadow-violet-200 transition-all flex items-center space-x-1.5"
            >
              <span>📄</span>
              <span>Copy Both Credentials</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Client Username */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                CLIENT USERNAME
              </label>
              <button
                onClick={() => copyToClipboard(clientUsername, 'Username')}
                className="text-violet-600 hover:text-violet-800 text-[11px] font-bold flex items-center space-x-1"
              >
                <span>📄</span>
                <span>Copy</span>
              </button>
            </div>
            <input
              type="text"
              value={clientUsername}
              onChange={(e) => setClientUsername(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-2xs"
            />
          </div>

          {/* Client Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                CLIENT PASSWORD
              </label>
              <button
                onClick={() => copyToClipboard(clientPassword, 'Password')}
                className="text-violet-600 hover:text-violet-800 text-[11px] font-bold flex items-center space-x-1"
              >
                <span>📄</span>
                <span>Copy</span>
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={clientPassword}
              onChange={(e) => setClientPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-2xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
