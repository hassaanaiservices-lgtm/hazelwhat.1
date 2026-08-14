'use client';

import { useState, useEffect } from 'react';
import ClientLayoutShell from '@/components/ClientLayoutShell';
import Link from 'next/link';

export default function ClientChatInboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isGlobalAutopilotOn, setIsGlobalAutopilotOn] = useState(true);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'conversations' | 'groups' | 'leads'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // 4 Default Realistic Demo Conversations requested for testing
  const demoConversations = [
    {
      customer: {
        id: 'cust-101',
        name: 'Farhan Ahmed',
        phone_number: '+92 300 1234567',
        is_human_handled: false,
        needs_human_attention: false,
      },
      lastMessage: {
        content: 'Hi, I want to confirm my order for the Silk Facial Kit.',
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
    },
    {
      customer: {
        id: 'cust-102',
        name: 'Ayesha Khan',
        phone_number: '+92 312 9876543',
        is_human_handled: false,
        needs_human_attention: false,
      },
      lastMessage: {
        content: 'Can I reschedule my appointment to 3 PM tomorrow?',
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    },
    {
      customer: {
        id: 'cust-103',
        name: 'Zubair Malik',
        phone_number: '+92 321 4567890',
        is_human_handled: true,
        needs_human_attention: true,
      },
      lastMessage: {
        content: 'Is the Organic Glow Serum available for delivery in Lahore?',
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    },
    {
      customer: {
        id: 'cust-104',
        name: 'Sara Ali',
        phone_number: '+92 333 7654321',
        is_human_handled: false,
        needs_human_attention: false,
      },
      lastMessage: {
        content: 'Thank you! The AI assistant answered all my questions perfectly.',
        created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      },
    },
  ];

  const demoMessagesMap: Record<string, any[]> = {
    'cust-101': [
      { id: 'm1', customer_id: 'cust-101', sender_type: 'customer', content: 'Hello! I saw your Silk Facial Treatment online.', created_at: '10:15 AM' },
      { id: 'm2', customer_id: 'cust-101', sender_type: 'bot', content: 'Welcome to HazelWhat Beauty! The Silk Facial Kit is Rs 15,000. Would you like to place an order?', created_at: '10:16 AM' },
      { id: 'm3', customer_id: 'cust-101', sender_type: 'customer', content: 'Hi, I want to confirm my order for the Silk Facial Kit.', created_at: '10:30 AM' },
    ],
    'cust-102': [
      { id: 'm4', customer_id: 'cust-102', sender_type: 'customer', content: 'I have a booking for VIP Hair Styling today.', created_at: '09:00 AM' },
      { id: 'm5', customer_id: 'cust-102', sender_type: 'bot', content: 'Your appointment is currently set for 11:30 AM. Can we help you reschedule?', created_at: '09:01 AM' },
      { id: 'm6', customer_id: 'cust-102', sender_type: 'customer', content: 'Can I reschedule my appointment to 3 PM tomorrow?', created_at: '09:45 AM' },
    ],
    'cust-103': [
      { id: 'm7', customer_id: 'cust-103', sender_type: 'customer', content: 'Is the Organic Glow Serum available for delivery in Lahore?', created_at: '08:15 AM' },
      { id: 'm8', customer_id: 'cust-103', sender_type: 'business', content: 'Hello Zubair! Yes, we offer express 24-hour delivery in Lahore.', created_at: '08:20 AM' },
    ],
    'cust-104': [
      { id: 'm9', customer_id: 'cust-104', sender_type: 'customer', content: 'What are your salon opening hours on weekends?', created_at: '07:00 AM' },
      { id: 'm10', customer_id: 'cust-104', sender_type: 'bot', content: 'We are open Saturday & Sunday from 10:00 AM to 9:00 PM.', created_at: '07:01 AM' },
      { id: 'm11', customer_id: 'cust-104', sender_type: 'customer', content: 'Thank you! The AI assistant answered all my questions perfectly.', created_at: '07:05 AM' },
    ],
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchAutopilotStatus = async () => {
    try {
      const res = await fetch('/api/client/autopilot');
      const data = await res.json();
      if (data.isGlobalAutopilotOn !== undefined) {
        setIsGlobalAutopilotOn(data.isGlobalAutopilotOn);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/client/chats');
      const data = await res.json();
      if (data.conversations && data.conversations.length > 0) {
        setConversations(data.conversations);
        if (!selectedCustomerId) setSelectedCustomerId(data.conversations[0].customer.id);
        if (data.messages) setMessages(data.messages);
      } else {
        // Fallback to demo conversations so user can test UI
        setConversations(demoConversations);
        if (!selectedCustomerId) setSelectedCustomerId(demoConversations[0].customer.id);
        setMessages(demoMessagesMap['cust-101']);
      }
    } catch (err) {
      setConversations(demoConversations);
      if (!selectedCustomerId) setSelectedCustomerId(demoConversations[0].customer.id);
      setMessages(demoMessagesMap['cust-101']);
    } finally {
      setLoading(false);
    }
  };

  const [waStatus, setWaStatus] = useState<any>({ status: 'DISCONNECTED', phoneNumber: null });

  const fetchWaStatus = async () => {
    try {
      const res = await fetch('/api/client/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        if (data.statusInfo) setWaStatus(data.statusInfo);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchWaStatus();
    fetchAutopilotStatus();
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedCustomerId && demoMessagesMap[selectedCustomerId]) {
      setMessages(demoMessagesMap[selectedCustomerId]);
    }
  }, [selectedCustomerId]);

  const selectedConv = conversations.find((c) => c.customer.id === selectedCustomerId);
  const activeMessages = messages.filter(
    (m) => m.customer_id === selectedCustomerId || !m.customer_id
  );

  const handleToggleGlobalAutopilot = async () => {
    try {
      const newStatus = !isGlobalAutopilotOn;
      setIsGlobalAutopilotOn(newStatus);
      showToast(`Global AI Autopilot turned ${newStatus ? 'ON' : 'OFF'}`);
      await fetch('/api/client/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_global', globalAutopilotEnabled: newStatus }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !replyContent.trim() || sending) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      customer_id: selectedCustomerId,
      sender_type: 'business',
      content: replyContent,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyContent('');
    showToast('Reply sent to customer via WhatsApp');

    try {
      setSending(true);
      await fetch('/api/client/chats/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedCustomerId, content: replyContent }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = c.customer.name?.toLowerCase() || '';
      const phone = c.customer.phone_number?.toLowerCase() || '';
      const lastMsg = c.lastMessage?.content?.toLowerCase() || '';
      if (!name.includes(q) && !phone.includes(q) && !lastMsg.includes(q)) return false;
    }
    if (activeTabFilter === 'groups') return false; // WhatsApp groups filter
    if (activeTabFilter === 'leads') return c.customer.needs_human_attention;
    return true;
  });

  return (
    <ClientLayoutShell>
      <div className="space-y-4 max-w-7xl font-sans antialiased">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-bounce">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Inbox Outer Container */}
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs flex flex-col lg:flex-row min-h-[680px]">
          {/* Left Sidebar Pane (Matching Mockup Screenshot) */}
          <div className="w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col p-4 space-y-4 shrink-0">
            {/* Dynamic WhatsApp Status Banner */}
            {waStatus?.status === 'CONNECTED' ? (
              <div className="bg-emerald-50/90 border border-emerald-200/70 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-600 text-base">🟢</span>
                  <span className="text-xs font-bold text-emerald-900">
                    WhatsApp Active ({waStatus.phoneNumber || 'Connected'})
                  </span>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ● Live Autopilot
                </span>
              </div>
            ) : (
              <div className="bg-amber-50/90 border border-amber-200/70 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-violet-600 text-base">🟣</span>
                  <span className="text-xs font-bold text-amber-900">WhatsApp Disconnected</span>
                </div>
                <Link
                  href="/whatsapp"
                  className="text-xs font-black text-violet-700 hover:text-violet-900 transition-colors"
                >
                  Connect WhatsApp
                </Link>
              </div>
            )}

            {/* 2. Global AI Autopilot Box matching screenshot */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-black text-slate-900">Global AI Autopilot</span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">Auto-save on toggle</div>
              </div>

              <button
                onClick={handleToggleGlobalAutopilot}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1 shadow-2xs ${
                  isGlobalAutopilotOn
                    ? 'bg-violet-600 text-white shadow-violet-200'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                <span>⚡</span>
                <span>{isGlobalAutopilotOn ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* 3. Search Bar matching screenshot */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            </div>

            {/* 4. Filter Pills Bar matching screenshot */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs font-bold">
              <button
                onClick={() => setActiveTabFilter('all')}
                className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  activeTabFilter === 'all'
                    ? 'bg-slate-900 text-white font-extrabold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTabFilter('conversations')}
                className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  activeTabFilter === 'conversations'
                    ? 'bg-slate-900 text-white font-extrabold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Conversations
              </button>
              <button
                onClick={() => setActiveTabFilter('groups')}
                className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  activeTabFilter === 'groups'
                    ? 'bg-slate-900 text-white font-extrabold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Groups
              </button>
            </div>

            {/* 5. Conversation List */}
            <div className="flex-1 overflow-y-auto space-y-2 pt-1">
              {loading ? (
                <div className="text-center text-xs text-slate-400 py-12">Loading chats...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">No chats found.</div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.customer.id === selectedCustomerId;
                  const needsHuman = conv.customer.needs_human_attention || conv.customer.is_human_handled;

                  return (
                    <button
                      key={conv.customer.id}
                      onClick={() => setSelectedCustomerId(conv.customer.id)}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-start space-x-3 border ${
                        isSelected
                          ? 'bg-purple-50/70 border-violet-300 shadow-2xs'
                          : 'bg-white border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {conv.customer.name?.slice(0, 2).toUpperCase() || 'WA'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {conv.customer.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">10:30 AM</span>
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono font-medium">
                          {conv.customer.phone_number}
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>

                      {needsHuman && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1"></span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Main Chat Thread Area */}
          <div className="flex-1 flex flex-col bg-slate-50/50">
            {selectedConv ? (
              <>
                {/* Active Chat Header */}
                <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-violet-200">
                      {selectedConv.customer.name?.slice(0, 2).toUpperCase() || 'WA'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">
                          {selectedConv.customer.name}
                        </h2>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>WhatsApp Online</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Phone: {selectedConv.customer.phone_number} • AI Autopilot Enabled
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => showToast('Switched to Copilot Human Agent mode')}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all"
                    >
                      👤 Copilot Agent Mode
                    </button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {activeMessages.map((msg) => {
                    const isCustomer = msg.sender_type === 'customer';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                      >
                        <div className="text-[10px] font-extrabold text-slate-400 mb-1 px-1">
                          {isCustomer ? selectedConv.customer.name : '🤖 AI Assistant / Business Agent'}
                        </div>
                        <div
                          className={`max-w-md rounded-3xl px-4 py-3 text-xs font-semibold shadow-2xs leading-relaxed ${
                            isCustomer
                              ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                              : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-violet-200'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                          {msg.created_at || '10:30 AM'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Composer Bar */}
                <form
                  onSubmit={handleSendReply}
                  className="p-4 bg-white border-t border-slate-100 flex items-center space-x-3"
                >
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type a message via WhatsApp..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyContent.trim()}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold px-5 py-3 rounded-2xl text-xs shadow-md shadow-violet-200 transition-all disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <span>✈️</span>
                    <span>{sending ? 'Sending...' : 'Send'}</span>
                  </button>
                </form>
              </>
            ) : (
              /* Empty Chat Panel State matching Screenshot */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-purple-50 text-violet-600 flex items-center justify-center text-2xl shadow-inner border border-purple-100">
                  💬
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Client Messaging Panel
                  </h2>
                  <p className="text-slate-400 text-xs font-semibold">
                    Select a contact from the list to start messaging.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayoutShell>
  );
}
