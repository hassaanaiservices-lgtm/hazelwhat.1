# HazelWhat Pre-Deployment & Post-Deploy Smoke Test Checklist

Execute this checklist on the **staging** environment before approving any production release or domain DNS cutover.

---

## 1. Platform Admin Operations
- [ ] **Admin Authentication**: Log in to `/admin/login` using administrative credentials.
- [ ] **Overview & System Health**: Navigate to `/admin` and `/admin/system` to verify Supabase DB connection, DeepSeek API status, OpenAI API status, and WhatsApp Baileys service status are all reported `HEALTHY`.
- [ ] **Client Provisioning**: Provision one fresh dummy tenant (e.g. `Smoke Test Salon`) on `/admin/clients`.
- [ ] **Empty State Verification**: Confirm the newly created tenant initializes with **zero customers, zero chat messages, zero orders, and zero appointments**.

---

## 2. Client Authentication & Dashboard Shell
- [ ] **Client Login**: Log in as a client role session to land on `/dashboard`.
- [ ] **Route Protection**: Attempt to navigate to `/admin` or `/admin/clients` as a client user and verify redirection/rejection with HTTP 403 Forbidden.
- [ ] **Metrics Overview**: Verify `/dashboard` renders accurate metrics cards (Messages Today, Active Conversations, AI vs Human split, Active Customers, Total Orders, Total Appointments, Pending Escalations).

---

## 3. WhatsApp Connection Flow
- [ ] **WhatsApp Page**: Navigate to `/whatsapp`.
- [ ] **QR Code Display**: Click "Connect WhatsApp" and verify QR code is rendered for session pairing.
- [ ] **Session Persistence**: Verify session status displays `CONNECTED` after pairing with phone.

---

## 4. Knowledge Base Ingestion & Structured Catalog
- [ ] **Structured Product Entry**: Add a product catalog item with exact numeric pricing (e.g., `Signature Treatment` - `$75.00`) on `/knowledge-base`.
- [ ] **FAQ & Policy Ingestion**: Add an FAQ entry (opening hours) and a Business Policy entry (cancellation policy).
- [ ] **Duplicate Detection**: Attempt to ingest an identical entry and verify duplicate detection warning.

---

## 5. End-to-End Messaging Pipeline & AI Execution
- [ ] **Incoming Text Question**: Send a WhatsApp text question from a real mobile device inquiring about product pricing.
- [ ] **AI Response Verification**: Verify AI responds automatically with exact pricing ($75.00) backed by Knowledge Base RAG.
- [ ] **Response Sanitization**: Confirm response contains zero internal reasoning (`<think>`, `Let me think...`) preambles.
- [ ] **Inbox Display**: Navigate to `/chats` and verify the message thread appears in light-mode inbox with the `🤖 AI Autopilot` tag.

---

## 6. Autopilot vs. Copilot Controls
- [ ] **Human Copilot Override**: Click `👤 Switch to Copilot (Human Handled)` on `/chats` for the conversation.
- [ ] **AI Pause Verification**: Send a second text message from the customer and verify AI skips automated reply, flagging the conversation `⚠️ Needs Human`.
- [ ] **Human Agent Reply**: Send a human reply from the inbox composer and verify it delivers over WhatsApp tagged `👤 Human Agent (Copilot)`.
- [ ] **Resume Autopilot**: Click `▶ Resume AI Autopilot` and verify automated AI replies resume specifically for that thread.

---

## 7. Operational Features (Orders & Appointments)
- [ ] **Place Order**: Navigate to `/orders` and place a new manual order or trigger order creation. Confirm status progresses `New` → `Confirmed` → `Completed`.
- [ ] **Book Appointment**: Navigate to `/appointments` and schedule an appointment. Confirm status progresses `Pending` → `Confirmed` → `Completed`.

---

## 8. Multi-Tenant Data Isolation Re-Verification
- [ ] **Second Tenant Login**: Log in as a completely separate test tenant (e.g. `Tenant Beta`).
- [ ] **Zero Visibility Check**: Confirm Tenant Beta's inbox, orders table, appointments list, and knowledge base show **zero visibility (0 records)** into `Smoke Test Salon`'s data.

---

## 9. Media Support Verification
- [ ] **Image Upload**: Send an image attachment over WhatsApp. Verify image uploads to Supabase Storage and renders a real `<img>` tag in the inbox.
- [ ] **Voice Note STT**: Send a voice note audio message over WhatsApp. Verify voice note is transcribed to text, AI responds with plain text over WhatsApp, and `<audio controls>` renders in the inbox.
