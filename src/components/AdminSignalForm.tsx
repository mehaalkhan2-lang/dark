import React, { useState } from 'react';
import { TRADING_PAIRS, TradeDirection } from '../types';
import { Send, PlusCircle, Clock } from 'lucide-react';

interface AdminSignalFormProps {
  onAddSignal: (signal: { pair: string; direction?: TradeDirection; entryPrice?: string; expiryMinutes: number; status: "active" | "pending"; type: "public" | "vip" }) => void;
}

export default function AdminSignalForm({ onAddSignal }: AdminSignalFormProps) {
  const [pair, setPair] = useState(TRADING_PAIRS[0]);
  const [direction, setDirection] = useState<TradeDirection>('CALL');
  const [entryPrice, setEntryPrice] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState(1);
  const [type, setType] = useState<"public" | "vip">("public");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmit, setLastSubmit] = useState(0);

  const handleSubmit = async (e: React.FormEvent, status: "active" | "pending") => {
    e.preventDefault();
    
    // Simple debounce to prevent mechanical double-clicks
    const now = Date.now();
    if (now - lastSubmit < 2000) return;
    setLastSubmit(now);
    
    setIsSubmitting(true);
    try {
      await onAddSignal({ 
        pair, 
        direction: status === 'active' ? direction : undefined, 
        entryPrice: entryPrice || undefined, 
        expiryMinutes,
        status,
        type
      });
      setEntryPrice('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PlusCircle className="text-white" size={20} />
          <h2 className="text-lg font-bold uppercase tracking-widest text-white">Broadcast System</h2>
        </div>
        <div className="flex gap-2 p-1.5 bg-white/5 border border-white/5 rounded-xl">
          <button
            onClick={() => setType("public")}
            className={`px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${type === 'public' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            PUBLIC
          </button>
          <button
            onClick={() => setType("vip")}
            className={`px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${type === 'vip' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:text-yellow-500/50'}`}
          >
            VIP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-2">Asset Pair</label>
          <select
            value={pair}
            onChange={(e) => setPair(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-white/30"
          >
            {TRADING_PAIRS.map((p) => (
              <option key={p} value={p} className="bg-black">
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 mb-2">Direction (If Active)</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDirection('CALL')}
              className={`flex-1 p-2 rounded-lg text-xs font-bold transition-all ${
                direction === 'CALL' ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-400'
              }`}
            >
              CALL
            </button>
            <button
              type="button"
              onClick={() => setDirection('PUT')}
              className={`flex-1 p-2 rounded-lg text-xs font-bold transition-all ${
                direction === 'PUT' ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400'
              }`}
            >
              PUT
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 mb-2">Entry Price (Optional)</label>
          <input
            type="text"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="0.00000"
            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
          />
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 mb-2">Expiry (Minutes)</label>
          <input
            type="number"
            value={expiryMinutes}
            onChange={(e) => setExpiryMinutes(parseInt(e.target.value))}
            min="1"
            max="60"
            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <button
          onClick={(e) => handleSubmit(e, 'pending')}
          disabled={isSubmitting}
          className="btn-outline flex items-center justify-center gap-2 border-dashed border-white/40 disabled:opacity-50 text-xs py-3"
        >
          <Clock size={18} />
          {isSubmitting ? '...' : 'PENDING'}
        </button>
        <button
          onClick={(e) => handleSubmit(e, 'active')}
          disabled={isSubmitting}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 text-xs py-3"
        >
          <Send size={18} />
          {isSubmitting ? '...' : 'BROADCAST'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (Notification.permission === 'granted') {
              new Notification("DARK TRADING ALERT", {
                body: `Test Signal: ${pair} | ${direction} | Entry: ${entryPrice || 'Market'}`,
                icon: 'https://cdn-icons-png.flaticon.com/512/1055/1055644.png'
              });
            } else {
              alert("Please enable notifications in the header first!");
            }
          }}
          className="bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
        >
          Test Push
        </button>
      </div>
    </div>
  );
}
