import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function SupportAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to the Dark Trading Command Center. I am your Strategic Assistant. Looking for signals, bot activation, or VIP access?',
      timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const SUGGESTIONS = [
    "How to activate bot?",
    "What are VIP signals?",
    "How to join?",
    "Show me reviews"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend: string, e?: React.FormEvent) => {
    e?.preventDefault();
    const content = textToSend.trim();
    if (!content || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are the Official Assistant for "Dark Trading".
          Our Platform Features:
          1. Public Signals: Free for everyone, monitored 24/7.
          2. VIP Signals: Premium accuracy signals for VIP members. Access costs a one-time fee/joining.
          3. Dark Trading Bot: AI-powered technical analysis bot. Activation fee is 1000 PKR (Paid via EasyPaisa to Hijran Bano at 03451959533).
          4. Reviews: Community profit proofs and testimonials.
          
          Your Goal: Help users understand the platform, guide them to signals, and explain the bot activation process.
          Tone: Professional, helpful, concise, slightly aggressive/technical "Dark" aesthetic.
          Keep responses short and focused on binary options trading within our platform.`,
        },
      });

      const result = await chat.sendMessage({ message: content });
      const text = result.text || "I couldn't process that request.";

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('Support Bot Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to the neural network. Please check your connection or try again later.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '60px' : '450px',
              width: '320px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass-panel border-white/10 bg-black/95 mb-4 overflow-hidden flex flex-col shadow-2xl shadow-red-500/20"
          >
            {/* Header */}
            <div className={`p-4 border-b border-white/5 flex items-center justify-between bg-red-600/10 ${isMinimized ? 'h-full' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Client Support</h3>
                  <span className="text-[8px] text-green-500 font-mono uppercase animate-pulse">Online Assist</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"
                >
                  {messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed shadow-lg ${
                        m.role === 'user' 
                          ? 'bg-red-600 text-white rounded-br-none' 
                          : 'bg-white/5 text-gray-200 border border-white/10 rounded-bl-none'
                      }`}>
                        {m.content}
                        <div className={`mt-1 text-[7px] uppercase font-mono ${m.role === 'user' ? 'text-white/50' : 'text-gray-500'}`}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 text-gray-400 border border-white/10 rounded-2xl rounded-bl-none p-3 px-4">
                        <div className="flex gap-1">
                          <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" />
                          <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {!isTyping && messages.length === 1 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSend(s)}
                          className="bg-red-600/10 border border-red-600/20 hover:bg-red-600/20 text-red-500 text-[10px] py-1 px-3 rounded-full transition-all uppercase font-black"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={(e) => handleSend(input, e)} className="p-3 border-t border-white/5 bg-black/40">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask the Assistant..."
                      className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-4 pr-10 text-xs text-white focus:outline-none focus:border-red-500/50 transition-all placeholder:text-gray-600"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isTyping}
                      className="absolute right-1 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-all disabled:opacity-50 disabled:bg-gray-800"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/30 border-2 border-white/20 transition-all ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-red-600 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-red-600">
          1
        </div>
      </motion.button>
    </div>
  );
}
