/**
 * HazelWhat Data-Access Module (src/lib/db.ts)
 * 
 * CORE SECURITY MANDATE:
 * This module is the ONLY way any application code is permitted to read or write database tables.
 * Every tenant function MUST take tenantId as a mandatory, explicit parameter.
 * If tenantId is falsy or missing, the function MUST log "[SECURITY] <function name> called without tenantId — refusing"
 * and immediately return empty result, refusing to run any query without tenant isolation.
 */

import { createAdminClient } from './supabase/admin';
import crypto from 'crypto';

// Types Definition
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'draft' | 'suspended';
  subscription_status: 'trial' | 'active' | 'past_due' | 'canceled';
  installation_fee?: number;
  monthly_fee?: number;
  currency?: string;
  client_username?: string;
  client_password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone_number?: string | null;
  email?: string | null;
  needs_human_attention?: boolean;
  is_human_handled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  tenant_id: string;
  customer_id: string;
  sender_type: 'customer' | 'business' | 'bot';
  content: string;
  message_id?: string | null;
  media_url?: string | null;
  media_type?: 'image' | 'audio' | 'video' | 'document' | string | null;
  created_at?: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  customer_id: string;
  items_description?: string | null;
  quantity: number;
  status: 'New' | 'Confirmed' | 'Completed' | 'Cancelled' | string;
  total_amount: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  customer_id: string;
  service?: string | null;
  scheduled_at: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TenantConfig {
  id: string;
  tenant_id: string;
  business_name: string;
  settings: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface AdminAuditLog {
  id?: string;
  admin_user: string;
  action: string;
  target_tenant_id?: string | null;
  details: Record<string, unknown>;
  created_at?: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  tenant_id: string;
  entry_type: 'faq' | 'policy' | 'product' | 'document';
  title: string;
  content: string;
  metadata: {
    price?: number;
    category?: string;
    currency?: string;
    url?: string;
    [key: string]: any;
  };
  content_hash: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardMetrics {
  messagesToday: number;
  totalConversations: number;
  aiHandledCount: number;
  humanHandledCount: number;
  activeCustomers: number;
  totalOrders: number;
  totalAppointments: number;
  pendingEscalations: number;
}

export interface TenantBillingOverview {
  tenantId: string;
  tenantName: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
  messageVolume: number;
  estimatedAiCost: number;
}

// Security Validation Helper
function validateTenantId(functionName: string, tenantId: string | null | undefined): boolean {
  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
    console.error(`[SECURITY] ${functionName} called without tenantId — refusing`);
    return false;
  }
  return true;
}

// Helper to acquire database client
function getClient() {
  return createAdminClient();
}

// In-Memory Fallback Stores for Demo/Placeholder DB environments
const fallbackTenants: Tenant[] = [];
const fallbackTenantConfigs = new Map<string, TenantConfig>();
const fallbackAuditLogs: AdminAuditLog[] = [];
const fallbackCustomers: Customer[] = [];
const fallbackChats: ChatMessage[] = [];
const fallbackOrders: Order[] = [];
const fallbackAppointments: Appointment[] = [];
const fallbackKnowledgeBase: KnowledgeBaseEntry[] = [];

function isPlaceholderDb(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return !url || url.includes('placeholder') || !key || key.includes('placeholder');
}

// Helper to calculate SHA-256 hash of content
export function generateContentHash(text: string): string {
  return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

// ==========================================
// TENANTS DATA ACCESS
// ==========================================

export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  if (!validateTenantId('getTenantById', tenantId)) return null;
  if (isPlaceholderDb()) {
    return fallbackTenants.find((t) => t.id === tenantId) || null;
  }
  try {
    const client = getClient();
    const { data, error } = await client.from('tenants').select('*').eq('id', tenantId).maybeSingle();
    if (error) throw error;
    return data || fallbackTenants.find((t) => t.id === tenantId) || null;
  } catch (err) {
    return fallbackTenants.find((t) => t.id === tenantId) || null;
  }
}

export async function createTenant(data: {
  name: string;
  slug: string;
  status?: 'active' | 'inactive' | 'draft' | 'suspended';
  subscription_status?: 'trial' | 'active' | 'past_due' | 'canceled';
  installation_fee?: number;
  monthly_fee?: number;
  currency?: string;
  client_username?: string;
  client_password?: string;
}): Promise<Tenant> {
  const cleanSlug = data.slug.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const generatedUsername = data.client_username || `${cleanSlug || 'client'}_${Math.floor(100 + Math.random() * 900)}`;
  const generatedPassword = data.client_password || `Pass_${Math.floor(1000 + Math.random() * 9000)}!`;

  const newTenant: Tenant = {
    id: crypto.randomUUID(),
    name: data.name,
    slug: data.slug,
    status: data.status || 'active',
    subscription_status: data.subscription_status || 'trial',
    installation_fee: data.installation_fee !== undefined ? data.installation_fee : 50000,
    monthly_fee: data.monthly_fee !== undefined ? data.monthly_fee : 15000,
    currency: data.currency || 'PKR',
    client_username: generatedUsername,
    client_password: generatedPassword,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isPlaceholderDb()) {
    fallbackTenants.push(newTenant);
    return newTenant;
  }

  try {
    const client = getClient();
    const { data: tenant, error } = await client.from('tenants').insert(newTenant).select('*').single();
    if (error) throw error;
    return tenant;
  } catch (err) {
    fallbackTenants.push(newTenant);
    return newTenant;
  }
}

export async function findTenantByCredentials(username: string, password: string): Promise<Tenant | null> {
  if (!username || !password) return null;
  const cleanUser = username.trim().toLowerCase();

  // First check in-memory fallback tenants
  const memoryMatch = fallbackTenants.find(
    (t) => (t.client_username?.toLowerCase() === cleanUser || t.slug.toLowerCase() === cleanUser) && t.client_password === password
  );
  if (memoryMatch) return memoryMatch;

  if (isPlaceholderDb()) return null;

  try {
    const client = getClient();
    const { data, error } = await client
      .from('tenants')
      .select('*')
      .or(`client_username.eq.${cleanUser},slug.eq.${cleanUser}`)
      .eq('client_password', password)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch (err) {
    return null;
  }
}

export async function deleteTenant(tenantId: string): Promise<boolean> {
  if (!validateTenantId('deleteTenant', tenantId)) return false;

  // Remove from fallback
  const idx = fallbackTenants.findIndex((t) => t.id === tenantId);
  if (idx !== -1) {
    fallbackTenants.splice(idx, 1);
    fallbackTenantConfigs.delete(tenantId);
  }

  if (isPlaceholderDb()) return true;

  try {
    const client = getClient();
    await client.from('tenant_configs').delete().eq('tenant_id', tenantId);
    const { error } = await client.from('tenants').delete().eq('id', tenantId);
    if (error) throw error;
    return true;
  } catch (err) {
    return true;
  }
}

export async function updateTenant(
  tenantId: string,
  updates: Partial<Omit<Tenant, 'id' | 'created_at'>>
): Promise<Tenant | null> {
  if (!validateTenantId('updateTenant', tenantId)) return null;
  if (isPlaceholderDb()) {
    const existingIndex = fallbackTenants.findIndex((t) => t.id === tenantId);
    if (existingIndex !== -1) {
      fallbackTenants[existingIndex] = {
        ...fallbackTenants[existingIndex],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return fallbackTenants[existingIndex];
    }
    return null;
  }
  try {
    const client = getClient();
    const { data, error } = await client
      .from('tenants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', tenantId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    const existingIndex = fallbackTenants.findIndex((t) => t.id === tenantId);
    if (existingIndex !== -1) {
      fallbackTenants[existingIndex] = {
        ...fallbackTenants[existingIndex],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return fallbackTenants[existingIndex];
    }
    return null;
  }
}

// ==========================================
// CUSTOMERS DATA ACCESS
// ==========================================

export async function getCustomers(tenantId: string): Promise<Customer[]> {
  if (!validateTenantId('getCustomers', tenantId)) return [];
  const client = getClient();
  const { data, error } = await client.from('customers').select('*').eq('tenant_id', tenantId);
  if (error) throw error;
  return data || [];
}

export async function getCustomerById(tenantId: string, customerId: string): Promise<Customer | null> {
  if (!validateTenantId('getCustomerById', tenantId)) return null;
  if (!customerId) return null;
  const client = getClient();
  const { data, error } = await client
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', customerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCustomerByPhone(tenantId: string, phoneNumber: string): Promise<Customer | null> {
  if (!validateTenantId('getCustomerByPhone', tenantId)) return null;
  if (!phoneNumber) return null;
  const client = getClient();
  const { data, error } = await client
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('phone_number', phoneNumber)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createCustomer(tenantId: string, customer: { name: string; phone_number?: string; email?: string }): Promise<Customer | null> {
  if (!validateTenantId('createCustomer', tenantId)) return null;
  const client = getClient();
  const { data, error } = await client
    .from('customers')
    .insert({ ...customer, tenant_id: tenantId, needs_human_attention: false, is_human_handled: false })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomerAutopilotState(
  tenantId: string,
  customerId: string,
  updates: Partial<{ needs_human_attention: boolean; is_human_handled: boolean }>
): Promise<Customer | null> {
  if (!validateTenantId('updateCustomerAutopilotState', tenantId)) return null;
  const client = getClient();
  const { data, error } = await client
    .from('customers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('id', customerId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// ==========================================
// CHAT MESSAGES DATA ACCESS
// ==========================================

export async function getChatMessages(tenantId: string, customerId?: string): Promise<ChatMessage[]> {
  if (!validateTenantId('getChatMessages', tenantId)) return [];
  const client = getClient();
  let query = client.from('chat_messages').select('*').eq('tenant_id', tenantId);
  if (customerId) {
    query = query.eq('customer_id', customerId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getChatMessageByMessageId(tenantId: string, messageId: string): Promise<ChatMessage | null> {
  if (!validateTenantId('getChatMessageByMessageId', tenantId)) return null;
  if (!messageId) return null;
  const client = getClient();
  const { data, error } = await client
    .from('chat_messages')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('message_id', messageId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createChatMessage(
  tenantId: string,
  message: {
    customer_id: string;
    sender_type: 'customer' | 'business' | 'bot';
    content: string;
    message_id?: string;
    media_url?: string;
    media_type?: 'image' | 'audio' | 'video' | 'document' | string;
  }
): Promise<ChatMessage | null> {
  if (!validateTenantId('createChatMessage', tenantId)) return null;
  const client = getClient();
  const { data, error } = await client
    .from('chat_messages')
    .insert({
      customer_id: message.customer_id,
      sender_type: message.sender_type,
      content: message.content,
      message_id: message.message_id || null,
      media_url: message.media_url || null,
      media_type: message.media_type || null,
      tenant_id: tenantId,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// ==========================================
// ORDERS DATA ACCESS
// ==========================================

export async function getOrders(tenantId: string): Promise<Order[]> {
  if (!validateTenantId('getOrders', tenantId)) return [];
  const client = getClient();
  const { data, error } = await client.from('orders').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getOrderById(tenantId: string, orderId: string): Promise<Order | null> {
  if (!validateTenantId('getOrderById', tenantId)) return null;
  if (!orderId) return null;
  const client = getClient();
  const { data, error } = await client
    .from('orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createOrder(
  tenantId: string,
  order: { customer_id: string; items_description?: string; quantity?: number; status?: string; total_amount: number; notes?: string }
): Promise<Order | null> {
  if (!validateTenantId('createOrder', tenantId)) return null;
  const client = getClient();
  const { data, error } = await client
    .from('orders')
    .insert({
      customer_id: order.customer_id,
      items_description: order.items_description || 'General Order',
      quantity: order.quantity || 1,
      status: order.status || 'New',
      total_amount: order.total_amount || 0,
      notes: order.notes || '',
      tenant_id: tenantId,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(
  tenantId: string,
  orderId: string,
  status: 'New' | 'Confirmed' | 'Completed' | 'Cancelled' | string,
  notes?: string
): Promise<Order | null> {
  if (!validateTenantId('updateOrderStatus', tenantId)) return null;
  const client = getClient();
  const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await client
    .from('orders')
    .update(updates)
    .eq('tenant_id', tenantId)
    .eq('id', orderId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// ==========================================
// APPOINTMENTS DATA ACCESS
// ==========================================

export async function getAppointments(tenantId: string): Promise<Appointment[]> {
  if (!validateTenantId('getAppointments', tenantId)) return [];
  const client = getClient();
  const { data, error } = await client.from('appointments').select('*').eq('tenant_id', tenantId).order('scheduled_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createAppointment(
  tenantId: string,
  appointment: { customer_id: string; service?: string; scheduled_at: string; status?: string; notes?: string }
): Promise<Appointment | null> {
  if (!validateTenantId('createAppointment', tenantId)) return null;
  const client = getClient();
  const { data, error } = await client
    .from('appointments')
    .insert({
      customer_id: appointment.customer_id,
      service: appointment.service || 'General Appointment',
      scheduled_at: appointment.scheduled_at,
      status: appointment.status || 'Pending',
      notes: appointment.notes || '',
      tenant_id: tenantId,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateAppointmentStatus(
  tenantId: string,
  appointmentId: string,
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | string,
  notes?: string
): Promise<Appointment | null> {
  if (!validateTenantId('updateAppointmentStatus', tenantId)) return null;
  const client = getClient();
  const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await client
    .from('appointments')
    .update(updates)
    .eq('tenant_id', tenantId)
    .eq('id', appointmentId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// ==========================================
// TENANT DASHBOARD METRICS DATA ACCESS
// ==========================================

export async function getTenantDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
  if (!validateTenantId('getTenantDashboardMetrics', tenantId)) {
    return {
      messagesToday: 0,
      totalConversations: 0,
      aiHandledCount: 0,
      humanHandledCount: 0,
      activeCustomers: 0,
      totalOrders: 0,
      totalAppointments: 0,
      pendingEscalations: 0,
    };
  }

  const [customers, messages, orders, appointments] = await Promise.all([
    getCustomers(tenantId),
    getChatMessages(tenantId),
    getOrders(tenantId),
    getAppointments(tenantId),
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const messagesToday = messages.filter((m) => (m.created_at || '').startsWith(todayStr)).length;

  const uniqueCustomerIds = new Set(messages.map((m) => m.customer_id));
  const totalConversations = uniqueCustomerIds.size;

  const aiHandledCount = messages.filter((m) => m.sender_type === 'bot').length;
  const humanHandledCount = messages.filter((m) => m.sender_type === 'business').length;

  const pendingEscalations = customers.filter(
    (c) => c.needs_human_attention === true || c.is_human_handled === true
  ).length;

  return {
    messagesToday,
    totalConversations,
    aiHandledCount,
    humanHandledCount,
    activeCustomers: customers.length,
    totalOrders: orders.length,
    totalAppointments: appointments.length,
    pendingEscalations,
  };
}

// ==========================================
// ADMIN BILLING OVERVIEW ACCESS
// ==========================================

export async function getAdminBillingOverview(authContext: { isAdmin: boolean }): Promise<TenantBillingOverview[]> {
  if (!authContext || authContext.isAdmin !== true) {
    console.error('[SECURITY] getAdminBillingOverview called without verified admin authorization — refusing');
    return [];
  }

  const tenants = await getAllTenantsForAdmin(authContext);
  const client = getClient();

  const overviews: TenantBillingOverview[] = [];

  for (const tenant of tenants) {
    const { data: messages } = await client.from('chat_messages').select('*').eq('tenant_id', tenant.id);
    const msgs = messages || [];

    const volume = msgs.length;
    let cost = 0;
    msgs.forEach((m) => {
      if (m.media_type === 'image' || m.media_type === 'audio') {
        cost += 0.005; // $0.005 per media / voice STT message
      } else {
        cost += 0.001; // $0.001 per text message
      }
    });

    overviews.push({
      tenantId: tenant.id,
      tenantName: tenant.name,
      subscriptionStatus: tenant.subscription_status,
      messageVolume: volume,
      estimatedAiCost: Number(cost.toFixed(3)),
    });
  }

  return overviews;
}

// ==========================================
// TENANT CONFIGS DATA ACCESS
// ==========================================

export async function getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
  if (!validateTenantId('getTenantConfig', tenantId)) return null;
  if (isPlaceholderDb()) {
    return fallbackTenantConfigs.get(tenantId) || null;
  }
  try {
    const client = getClient();
    const { data, error } = await client
      .from('tenant_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (error) throw error;
    return data || fallbackTenantConfigs.get(tenantId) || null;
  } catch (err) {
    return fallbackTenantConfigs.get(tenantId) || null;
  }
}

export async function createTenantConfig(
  tenantId: string,
  config: { business_name: string; settings?: Record<string, unknown> }
): Promise<TenantConfig | null> {
  if (!validateTenantId('createTenantConfig', tenantId)) return null;

  const newConfig: TenantConfig = {
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    business_name: config.business_name,
    settings: config.settings || { autopilot_enabled: true },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isPlaceholderDb()) {
    fallbackTenantConfigs.set(tenantId, newConfig);
    return newConfig;
  }

  try {
    const client = getClient();
    const { data, error } = await client
      .from('tenant_configs')
      .insert({ ...config, tenant_id: tenantId, settings: config.settings || { autopilot_enabled: true } })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    fallbackTenantConfigs.set(tenantId, newConfig);
    return newConfig;
  }
}

export async function updateTenantConfig(
  tenantId: string,
  updates: Partial<{ business_name: string; settings: Record<string, unknown> }>
): Promise<TenantConfig | null> {
  if (!validateTenantId('updateTenantConfig', tenantId)) return null;

  const existing = await getTenantConfig(tenantId);
  if (!existing) {
    return await createTenantConfig(tenantId, {
      business_name: updates.business_name || 'Business',
      settings: updates.settings || { autopilot_enabled: true },
    });
  }

  const updatedConfig: TenantConfig = {
    ...existing,
    business_name: updates.business_name || existing.business_name,
    settings: updates.settings ? { ...existing.settings, ...updates.settings } : existing.settings,
    updated_at: new Date().toISOString(),
  };

  if (isPlaceholderDb()) {
    fallbackTenantConfigs.set(tenantId, updatedConfig);
    return updatedConfig;
  }

  try {
    const client = getClient();
    const { data, error } = await client
      .from('tenant_configs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    fallbackTenantConfigs.set(tenantId, updatedConfig);
    return updatedConfig;
  }
}

// ==========================================
// KNOWLEDGE BASE DATA ACCESS
// ==========================================

export async function getKnowledgeBaseEntries(tenantId: string): Promise<KnowledgeBaseEntry[]> {
  if (!validateTenantId('getKnowledgeBaseEntries', tenantId)) return [];
  const client = getClient();
  const { data, error } = await client
    .from('knowledge_base_entries')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createKnowledgeBaseEntry(
  tenantId: string,
  entry: {
    entry_type: 'faq' | 'policy' | 'product' | 'document';
    title: string;
    content: string;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean; entry?: KnowledgeBaseEntry; isDuplicate?: boolean; error?: string }> {
  if (!validateTenantId('createKnowledgeBaseEntry', tenantId)) {
    return { success: false, error: 'Invalid tenantId' };
  }

  const contentHash = generateContentHash(`${entry.entry_type}:${entry.title}:${entry.content}`);
  const client = getClient();

  const { data: existing } = await client
    .from('knowledge_base_entries')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('content_hash', contentHash)
    .maybeSingle();

  if (existing) {
    console.warn(`[KB] Duplicate entry hash detected for tenant ${tenantId} — skipping re-ingestion.`);
    return { success: false, isDuplicate: true, entry: existing, error: 'Duplicate content already exists in knowledge base' };
  }

  const { data, error } = await client
    .from('knowledge_base_entries')
    .insert({
      tenant_id: tenantId,
      entry_type: entry.entry_type,
      title: entry.title,
      content: entry.content,
      metadata: entry.metadata || {},
      content_hash: contentHash,
    })
    .select('*')
    .single();

  if (error) throw error;
  return { success: true, entry: data };
}

export async function updateKnowledgeBaseEntry(
  tenantId: string,
  entryId: string,
  updates: Partial<{ title: string; content: string; metadata: Record<string, any> }>
): Promise<KnowledgeBaseEntry | null> {
  if (!validateTenantId('updateKnowledgeBaseEntry', tenantId)) return null;
  const client = getClient();

  const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.title) updatePayload.title = updates.title;
  if (updates.content) updatePayload.content = updates.content;
  if (updates.metadata) updatePayload.metadata = updates.metadata;

  if (updates.title || updates.content) {
    const existing = await client.from('knowledge_base_entries').select('*').eq('tenant_id', tenantId).eq('id', entryId).single();
    if (existing.data) {
      updatePayload.content_hash = generateContentHash(
        `${existing.data.entry_type}:${updates.title || existing.data.title}:${updates.content || existing.data.content}`
      );
    }
  }

  const { data, error } = await client
    .from('knowledge_base_entries')
    .update(updatePayload)
    .eq('tenant_id', tenantId)
    .eq('id', entryId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteKnowledgeBaseEntry(tenantId: string, entryId: string): Promise<boolean> {
  if (!validateTenantId('deleteKnowledgeBaseEntry', tenantId)) return false;
  const client = getClient();
  const { error } = await client
    .from('knowledge_base_entries')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', entryId);

  if (error) throw error;
  return true;
}

// ==========================================
// ADMIN AUDIT LOGS & CROSS-TENANT ACCESS
// ==========================================

export async function createAdminAuditLog(
  authContext: { isAdmin: boolean },
  log: { action: string; target_tenant_id?: string | null; details?: Record<string, unknown> }
): Promise<AdminAuditLog | null> {
  if (!authContext || authContext.isAdmin !== true) {
    console.error('[SECURITY] createAdminAuditLog called without verified admin authorization — refusing');
    return null;
  }
  const entry: AdminAuditLog = {
    id: crypto.randomUUID(),
    admin_user: 'system_admin',
    action: log.action,
    target_tenant_id: log.target_tenant_id || null,
    details: log.details || {},
    created_at: new Date().toISOString(),
  };

  if (isPlaceholderDb()) {
    fallbackAuditLogs.push(entry);
    return entry;
  }

  try {
    const client = getClient();
    const { data, error } = await client
      .from('admin_audit_logs')
      .insert({
        admin_user: 'system_admin',
        action: log.action,
        target_tenant_id: log.target_tenant_id || null,
        details: log.details || {},
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    fallbackAuditLogs.push(entry);
    return entry;
  }
}

export async function getAllChatsForAdmin(authContext: { isAdmin: boolean }): Promise<ChatMessage[]> {
  if (!authContext || authContext.isAdmin !== true) {
    console.error('[SECURITY] getAllChatsForAdmin called without verified admin authorization — refusing');
    return [];
  }
  if (isPlaceholderDb()) {
    return [...fallbackChats];
  }
  try {
    const client = getClient();
    const { data, error } = await client.from('chat_messages').select('*');
    if (error) throw error;
    return data || fallbackChats;
  } catch (err) {
    return [...fallbackChats];
  }
}

export async function getAllTenantsForAdmin(authContext: { isAdmin: boolean }): Promise<Tenant[]> {
  if (!authContext || authContext.isAdmin !== true) {
    console.error('[SECURITY] getAllTenantsForAdmin called without verified admin authorization — refusing');
    return [];
  }
  if (isPlaceholderDb()) {
    return [...fallbackTenants];
  }
  try {
    const client = getClient();
    const { data, error } = await client.from('tenants').select('*');
    if (error) throw error;
    return data || fallbackTenants;
  } catch (err) {
    return [...fallbackTenants];
  }
}
