import {
  getTenantById,
  getCustomerByPhone,
  createCustomer,
  getChatMessageByMessageId,
  createChatMessage,
  getTenantConfig,
  updateCustomerAutopilotState,
  ChatMessage,
} from '../db';
import { whatsAppService } from '../whatsapp';
import { callAiProviderWithFallback } from '../ai/provider-engine';
import { uploadChatMediaToSupabaseStorage } from '../media/storage';
import { transcribeAudioVoiceNote } from '../media/transcribe';

export interface IncomingTextPayload {
  sessionTenantId: string;
  messageId: string;
  fromPhoneNumber: string;
  senderName?: string;
  text: string;
  timestamp?: Date;
  // Media optional fields
  mediaBuffer?: Buffer;
  mediaType?: 'image' | 'audio' | 'video' | 'document' | string;
  mimeType?: string;
  filename?: string;
}

/**
 * CORE TENANT RESOLUTION FUNCTION
 */
export async function resolveTenantForSession(sessionTenantId: string): Promise<string | null> {
  if (!sessionTenantId || typeof sessionTenantId !== 'string' || sessionTenantId.trim() === '') {
    console.error(`[PIPELINE][SECURITY] Missing session tenantId — dropping message.`);
    return null;
  }

  try {
    const tenant = await getTenantById(sessionTenantId);
    if (!tenant) {
      console.error(`[PIPELINE][SECURITY] Unresolved tenant '${sessionTenantId}' — dropping message.`);
      return null;
    }

    if (tenant.status !== 'active') {
      console.warn(`[PIPELINE][SECURITY] Tenant '${sessionTenantId}' is inactive/deactivated — dropping message.`);
      return null;
    }

    return tenant.id;
  } catch (error) {
    console.error(`[PIPELINE][SECURITY] Error resolving tenant '${sessionTenantId}' — dropping message:`, error);
    return null;
  }
}

/**
 * END-TO-END TEXT & MEDIA MESSAGE PIPELINE PROCESSOR
 */
export async function processIncomingTextMessage(
  payload: IncomingTextPayload
): Promise<{ success: boolean; chatMessage?: ChatMessage | null; replyText?: string; isAutopilotActive?: boolean; reason?: string }> {
  // STEP 1: RESOLVE TENANT ID VIA SINGLE AUTHORITATIVE FUNCTION
  const tenantId = await resolveTenantForSession(payload.sessionTenantId);

  if (!tenantId) {
    return {
      success: false,
      reason: 'UNRESOLVED_TENANT',
    };
  }

  // STEP 2: MESSAGE DEDUPLICATION CHECK
  const existingMessage = await getChatMessageByMessageId(tenantId, payload.messageId);
  if (existingMessage) {
    console.log(`[PIPELINE] Duplicate message_id '${payload.messageId}' detected — ignoring duplicate delivery.`);
    return {
      success: true,
      chatMessage: existingMessage,
      reason: 'DUPLICATE_IGNORED',
    };
  }

  // STEP 3: FIND OR CREATE CUSTOMER FOR THIS EXACT TENANT_ID
  let customer = await getCustomerByPhone(tenantId, payload.fromPhoneNumber);
  if (!customer) {
    customer = await createCustomer(tenantId, {
      name: payload.senderName || payload.fromPhoneNumber,
      phone_number: payload.fromPhoneNumber,
    });
  }

  if (!customer) {
    throw new Error(`Failed to create or find customer for tenant ${tenantId}`);
  }

  // STEP 4: PROCESS MEDIA (STORAGE UPLOAD & VOICE NOTE TRANSCRIPTION)
  let mediaUrl: string | undefined = undefined;
  let textToProcess = payload.text || '';

  if (payload.mediaBuffer) {
    const defaultExt = payload.mediaType === 'image' ? 'jpg' : 'ogg';
    const filename = payload.filename || `${payload.mediaType}_${Date.now()}.${defaultExt}`;
    
    // Upload image or voice note to Supabase Storage using resolved tenantId
    mediaUrl = await uploadChatMediaToSupabaseStorage(
      tenantId, // Exact same tenantId
      payload.mediaBuffer,
      payload.mimeType || (payload.mediaType === 'image' ? 'image/jpeg' : 'audio/ogg'),
      filename
    );

    // If Voice Note ('audio'), transcribe STT audio to text
    if (payload.mediaType === 'audio') {
      const transcription = await transcribeAudioVoiceNote(payload.mediaBuffer, payload.mimeType);
      textToProcess = transcription;
      console.log(`[PIPELINE][STT] Voice note transcribed to text: "${transcription}"`);
    }
  }

  // STEP 5: SAVE INCOMING MESSAGE IN DATABASE FOR THIS EXACT TENANT_ID
  const savedMessage = await createChatMessage(tenantId, {
    customer_id: customer.id,
    sender_type: 'customer',
    content: textToProcess || (payload.mediaType === 'image' ? '[Image Attachment]' : '[Media Attachment]'),
    message_id: payload.messageId,
    media_url: mediaUrl,
    media_type: payload.mediaType,
  });

  // STEP 6: CHECK AUTOPILOT PRECEDENCE (GLOBAL & PER-CONVERSATION TOGGLES)
  const config = await getTenantConfig(tenantId);
  const isGlobalAutopilotOn = config?.settings?.autopilot_enabled !== false;
  const isConversationHumanHandled = customer.is_human_handled === true;

  if (!isGlobalAutopilotOn || isConversationHumanHandled) {
    console.log(
      `[PIPELINE][AUTOPILOT] Autopilot disabled/overridden. Skipping AI reply for customer ${customer.id}.`
    );

    await updateCustomerAutopilotState(tenantId, customer.id, {
      needs_human_attention: true,
    });

    return {
      success: true,
      chatMessage: savedMessage,
      isAutopilotActive: false,
      reason: 'AUTOPILOT_DISABLED_WAITING_FOR_HUMAN',
    };
  }

  // STEP 7: GENERATE LIVE AI RESPONSE VIA DEEPSEEK/OPENAI ENGINE + RAG CONTEXT
  // PERMANENT DECISION: Voice notes are processed as text and replies are ALWAYS sent as plain text.
  const aiResult = await callAiProviderWithFallback({
    tenantId: tenantId,
    userQuery: textToProcess || 'Customer sent an image.',
    senderPhone: payload.fromPhoneNumber,
  });

  if (aiResult.needsHumanEscalation) {
    console.warn(`[PIPELINE][AUTOPILOT] AI requested escalation. Flagging customer ${customer.id}.`);
    await updateCustomerAutopilotState(tenantId, customer.id, {
      needs_human_attention: true,
      is_human_handled: true,
    });
  }

  // STEP 8: DELIVER AI RESPONSE AS PLAIN TEXT OVER WHATSAPP
  await whatsAppService.sendMessage({
    tenantId: tenantId,
    toPhoneNumber: payload.fromPhoneNumber,
    content: aiResult.text,
  });

  // STEP 9: SAVE OUTGOING AI/BOT MESSAGE IN DATABASE
  if (savedMessage) {
    await createChatMessage(tenantId, {
      customer_id: customer.id,
      sender_type: 'bot',
      content: aiResult.text,
      message_id: `ai_${Date.now()}`,
    });
  }

  return {
    success: true,
    chatMessage: savedMessage,
    replyText: aiResult.text,
    isAutopilotActive: true,
  };
}
