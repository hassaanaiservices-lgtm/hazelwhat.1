import ClientLayoutShell from '@/components/ClientLayoutShell';

export default function ClientAiEmployeePage() {
  return (
    <ClientLayoutShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-100">AI Employee Configuration</h1>
        <p className="text-slate-400 text-sm">Customize your AI assistant's persona, tone, system instructions, and response behavior.</p>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
          AI Employee settings & persona editor shell.
        </div>
      </div>
    </ClientLayoutShell>
  );
}
