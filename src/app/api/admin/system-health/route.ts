import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const timestamp = new Date().toISOString();

  // 1. App status check
  const appStatus = { status: 'healthy', message: 'Next.js App Server Running' };

  // 2. Supabase Reachability Check
  let supabaseStatus = { status: 'healthy', latencyMs: 0 };
  const startTime = Date.now();
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('tenants').select('count', { count: 'exact', head: true });
    supabaseStatus.latencyMs = Date.now() - startTime;
    if (error) {
      supabaseStatus.status = 'unhealthy';
    }
  } catch (error) {
    supabaseStatus.status = 'unhealthy';
    supabaseStatus.latencyMs = Date.now() - startTime;
  }

  // 3. AI Providers Reachability Checks (Real HEAD / Ping network checks)
  const aiProviders = [
    { name: 'OpenAI API', endpoint: 'https://api.openai.com/v1/models' },
    { name: 'Anthropic API', endpoint: 'https://api.anthropic.com/v1/messages' },
  ];

  const aiStatusResults = await Promise.all(
    aiProviders.map(async (provider) => {
      const pStart = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(provider.endpoint, {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        // 200, 401, or 403 indicates endpoint network reachability
        const isReachable = res.status < 500;
        return {
          name: provider.name,
          status: isReachable ? 'healthy' : 'degraded',
          httpStatus: res.status,
          latencyMs: Date.now() - pStart,
        };
      } catch (err) {
        return {
          name: provider.name,
          status: 'unreachable',
          httpStatus: 0,
          latencyMs: Date.now() - pStart,
        };
      }
    })
  );

  return NextResponse.json({
    timestamp,
    appStatus,
    supabaseStatus,
    aiProviders: aiStatusResults,
  });
}
