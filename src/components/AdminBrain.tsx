import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Zap, Target, BarChart3, AlertTriangle, RefreshCw, ChevronRight, Bell, Gauge } from 'lucide-react';

interface Suggestion {
  symbol: string;
  direction: string;
  confidence: number;
  reason: string;
  entry: string;
  isCritical?: boolean;
}

export default function AdminBrain() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autopilot, setAutopilot] = useState(false);
  const autopilotInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (isAuto = false) => {
    if (!isAuto) setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error("Brain synchronization failure");
      const data = await response.json();
      
      const newSuggestions = data.suggestions || [];
      setSuggestions(newSuggestions);

      // Check for critical setups to notify
      const critical = newSuggestions.find((s: Suggestion) => s.isCritical || s.confidence >= 97);
      if (critical && autopilot) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`CRITICAL SETUP: ${critical.symbol}`, {
            body: `${critical.direction} at ${critical.entry} - ${critical.reason}`,
            icon: "/favicon.ico"
          });
        }
      }
    } catch (err: any) {
      if (!isAuto) setError(err.message);
    } finally {
      if (!isAuto) setLoading(false);
    }
  };

  useEffect(() => {
    if (autopilot) {
      fetchSuggestions(true);
      autopilotInterval.current = setInterval(() => fetchSuggestions(true), 120000); // Scan every 2 minutes
    } else {
      if (autopilotInterval.current) clearInterval(autopilotInterval.current);
    }
    return () => {
      if (autopilotInterval.current) clearInterval(autopilotInterval.current);
    };
  }, [autopilot]);

  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  return (
    <div className="glass-panel border-red-500/20 bg-red-500/5 p-6 mb-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Zap size={120} className={autopilot ? "text-red-500 animate-pulse" : ""} />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between mb-6 relative z-10 gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${autopilot ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/40' : 'bg-red-600/20 border-red-500/30'}`}>
            <Cpu className={autopilot ? "text-white animate-spin" : "text-red-500"} size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter">Quant Brain Advisor</h3>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${autopilot ? 'bg-green-500 animate-ping' : 'bg-gray-500'}`} />
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                {autopilot ? 'Autopilot Active (2m Scan)' : 'Neural Market Intelligence'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setAutopilot(!autopilot);
              requestNotificationPermission();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
              autopilot ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
            }`}
          >
            <Gauge size={14} />
            {autopilot ? 'Autopilot On' : 'Autopilot Off'}
          </button>
          <button 
            onClick={() => fetchSuggestions()}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
              loading ? 'bg-white/5 text-gray-500' : 'bg-white text-black hover:bg-red-500 hover:text-white shadow-lg'
            }`}
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {loading ? 'Analyzing...' : 'Manual Scan'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 text-center"
          >
            <div className="w-16 h-16 border-4 border-red-500/10 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-mono text-red-500 uppercase tracking-[0.3em] animate-pulse">Running institutional velocity scan...</p>
          </motion.div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-center text-xs"
          >
            <AlertTriangle className="mx-auto mb-2" size={20} />
            {error}
          </motion.div>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestions.map((s, idx) => (
              <motion.div
                key={s.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-black/40 border rounded-xl p-4 transition-all group relative overflow-hidden ${
                  s.isCritical || s.confidence >= 97 ? 'border-red-500 shadow-lg shadow-red-500/10' : 'border-white/5 hover:border-red-500/30'
                }`}
              >
                {(s.isCritical || s.confidence >= 97) && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-red-500 text-white text-[7px] font-black uppercase px-2 py-0.5 tracking-tighter rotate-45 translate-x-2 -translate-y-1">
                      CRITICAL
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black italic tracking-tighter">{s.symbol}</span>
                    {s.isCritical && <Bell size={10} className="text-red-500 animate-bounce" />}
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    s.direction === 'CALL' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {s.direction}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                    <span className="text-gray-500">Confidence</span>
                    <span className={s.isCritical ? "text-red-500 font-black animate-pulse" : "text-white font-bold"}>
                      {s.confidence}%
                    </span>
                  </div>
                  
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${s.confidence}%` }}
                      className={`h-full ${s.confidence >= 97 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : s.confidence > 90 ? 'bg-green-500' : 'bg-yellow-500'}`}
                    />
                  </div>

                  <p className={`text-[10px] line-clamp-3 leading-relaxed border-l-2 pl-2 ${
                    s.isCritical ? 'text-white font-bold border-red-500' : 'text-gray-400 italic border-red-500/20'
                  }`}>
                    {s.reason}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-500 uppercase">
                      <Target size={12} className={s.isCritical ? "text-red-500 animate-pulse" : "text-red-500"} />
                      Entry: <span className="text-white font-bold">{s.entry}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 opacity-30">
            <Cpu className="mx-auto mb-2" size={32} />
            <p className="text-[10px] font-mono uppercase tracking-widest">Awaiting Command Sequence</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
