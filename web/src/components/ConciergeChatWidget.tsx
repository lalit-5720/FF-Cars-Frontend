'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  MapPin, 
  Phone, 
  Calendar, 
  CircleDollarSign, 
  ShieldCheck, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  actionUrl?: string;
  actionLabel?: string;
  time: string;
}

export function ConciergeChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Welcome to CarRevive Luxury Concierge! How may I assist your automotive search today?',
      time: 'Just now'
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');

    // Generate Intelligent Concierge Response
    setTimeout(() => {
      let botResponse: ChatMessage;
      const lower = text.toLowerCase();

      if (lower.includes('loan') || lower.includes('emi') || lower.includes('finance')) {
        botResponse = {
          id: String(Date.now() + 1),
          sender: 'bot',
          text: 'We provide preferred 8.5% PA fixed luxury auto financing with zero foreclosure penalties through HDFC, ICICI & Kotak Prime. You can estimate monthly installments directly on any vehicle page.',
          actionUrl: '/cars',
          actionLabel: 'Browse Vehicles & Estimate EMI',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else if (lower.includes('showroom') || lower.includes('location') || lower.includes('address') || lower.includes('branch')) {
        botResponse = {
          id: String(Date.now() + 1),
          sender: 'bot',
          text: 'We welcome you at our two flagship experience centers:\n\n📍 Anna Nagar: 100 Feet Road (Call: 9840123456)\n📍 Velachery: 100 Feet Bypass Road (Call: 9840234567)\n\nOpen daily from 9:30 AM to 8:30 PM.',
          actionUrl: '/cars',
          actionLabel: 'Explore Showroom Inventory',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else if (lower.includes('test') || lower.includes('drive') || lower.includes('book')) {
        botResponse = {
          id: String(Date.now() + 1),
          sender: 'bot',
          text: 'You can schedule a personalized showroom test drive or doorstep executive test drive on any available model in our inventory.',
          actionUrl: '/cars',
          actionLabel: 'Select Car for Test Drive',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else if (lower.includes('inspection') || lower.includes('quality') || lower.includes('warranty')) {
        botResponse = {
          id: String(Date.now() + 1),
          sender: 'bot',
          text: 'Every vehicle undergoes our rigorous 150-Point Technical Certification and includes our signature 5-Day No-Questions-Asked Full Refund Guarantee.',
          actionUrl: '/cars',
          actionLabel: 'View Certified Cars',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else {
        botResponse = {
          id: String(Date.now() + 1),
          sender: 'bot',
          text: 'Thank you for reaching out! Our senior automotive concierge is notified and available to answer any questions about our certified luxury collection.',
          actionUrl: '/cars',
          actionLabel: 'View Active Inventory',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }

      setMessages((prev) => [...prev, botResponse]);
    }, 500);
  };

  const quickPrompts = [
    { label: '💳 Luxury EMI & Finance', query: 'What are the auto financing options and interest rates?' },
    { label: '📍 Showroom Locations', query: 'Where are the showrooms located in Chennai and what are the timings?' },
    { label: '🛡️ 150-Point Inspection', query: 'What does your vehicle inspection and warranty guarantee include?' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 print:hidden">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] border border-amber-500/40 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:border-amber-400 cursor-pointer"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0F172A] animate-pulse" />
          </div>
          <div className="text-left leading-none">
            <span className="text-xs font-extrabold text-white block">Luxury Concierge</span>
            <span className="text-[10px] text-amber-400 font-semibold mt-0.5 block">Online &bull; Instant Help</span>
          </div>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-[#0B0F1A] border border-[#2D374A] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 bg-[#141A2A] border-b border-[#2D374A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                  CR
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#141A2A]" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white font-display flex items-center gap-1.5">
                  CarRevive Concierge
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h4>
                <p className="text-[10px] text-emerald-400 font-medium">Chennai Showrooms Active</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Prompt Chips */}
          <div className="p-2.5 bg-[#0E1424] border-b border-[#1E2638] flex gap-2 overflow-x-auto scrollbar-none">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q.query)}
                className="whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold bg-gray-800/80 hover:bg-amber-500 hover:text-black text-gray-300 transition-all border border-gray-700 cursor-pointer"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-black font-medium rounded-br-none'
                      : 'bg-[#141A2A] text-gray-200 border border-[#232D42] rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {msg.actionUrl && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push(msg.actionUrl!);
                      }}
                      className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] transition-all cursor-pointer shadow-sm"
                    >
                      {msg.actionLabel || 'Learn More'} &rarr;
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-gray-500 mt-1 px-1 font-mono">{msg.time}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#101626] border-t border-[#1E2638] flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about inventory, loans, test rides..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-[#0B0F1A] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
