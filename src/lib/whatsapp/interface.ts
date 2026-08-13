/**
 * WhatsApp Provider Abstract Interface (IWhatsAppService)
 * 
 * ARCHITECTURAL MANDATE:
 * This interface defines the clean boundary between HazelWhat application logic
 * (AI bot, tenants, chats, orders, dashboard) and the underlying WhatsApp provider.
 * 
 * Any WhatsApp library (e.g. Baileys QR socket or Meta's official WhatsApp Business Cloud API)
 * MUST implement this exact contract.
 */

export type WhatsAppConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export interface WhatsAppSessionInfo {
  tenantId: string;
  status: WhatsAppConnectionStatus;
  phoneNumber?: string | null;
  qrCodeDataUrl?: string | null;
  errorMessage?: string | null;
  lastConnectedAt?: string | null;
}

export interface IncomingMessage {
  tenantId: string;
  fromPhoneNumber: string;
  customerName?: string;
  content: string;
  timestamp: Date;
}

export interface OutgoingMessage {
  tenantId: string;
  toPhoneNumber: string;
  content: string;
}

export interface IWhatsAppService {
  /**
   * Initiate or restore WhatsApp connection for a specific tenant.
   */
  connect(tenantId: string): Promise<WhatsAppSessionInfo>;

  /**
   * Disconnect and purge persistent session data for a specific tenant.
   */
  disconnect(tenantId: string): Promise<void>;

  /**
   * Get current live connection status and QR code string if applicable.
   */
  getStatus(tenantId: string): Promise<WhatsAppSessionInfo>;

  /**
   * Send an outgoing WhatsApp text message to a customer.
   */
  sendMessage(message: OutgoingMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;

  /**
   * Register incoming message event handler callback.
   */
  onMessage(handler: (msg: IncomingMessage) => void): void;
}
