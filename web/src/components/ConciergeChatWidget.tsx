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
          className="group flex items-center gap-3 px-4 py-2.5 rounded-full bg-accent text-white shadow-lg transition-all hover:opacity-90 cursor-pointer"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-status-success border-2 border-accent" />
          </div>
          <div className="text-left leading-tight">
            <span className="text-xs font-bold text-white block">Luxury Concierge</span>
            <span className="text-xs text-white/80 block">Online &bull; Instant Help</span>
          </div>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-bg-surface border border-border rounded-lg shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3 bg-bg-surface-alt border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-xs">
                  CR
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-status-success border border-bg-surface-alt" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  CarRevive Concierge
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                </h4>
                <p className="text-xs text-text-secondary">Chennai Showrooms Active</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="btn-neutral w-8 h-8 p-0 flex items-center justify-center rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Prompt Chips */}
          <div className="p-2 bg-bg-surface-alt border-b border-border flex gap-2 overflow-x-auto">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q.query)}
                className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold bg-bg-surface text-text-secondary hover:text-text-primary transition-colors border border-border cursor-pointer"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-bg-page">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg text-xs leading-normal ${
                    msg.sender === 'user'
                      ? 'bg-accent text-white font-normal'
                      : 'bg-bg-surface text-text-primary border border-border'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {msg.actionUrl && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push(msg.actionUrl!);
                      }}
                      className="mt-2 w-full btn-primary h-8 text-xs flex items-center justify-center gap-1"
                    >
                      {msg.actionLabel || 'Learn More'} &rarr;
                    </button>
                  )}
                </div>
                <span className="text-xs text-text-secondary mt-1 px-1">{msg.time}</span>
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
            className="p-3 bg-bg-surface border-t border-border flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about inventory, loans, test rides..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="input-base flex-1 text-xs h-9"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="btn-primary w-9 h-9 p-0 flex items-center justify-center rounded-lg disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
