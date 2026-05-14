import React, { useState, useEffect } from 'react';
import { Signal, TradeDirection } from '../types';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, AlertCircle, Trash2, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface SignalCardProps {
  key?: React.Key;
  signal: Signal;
  onUpdateStatus?: (id: string, status: Signal['status']) => void;
  onSetDirection?: (id: string, direction: TradeDirection) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export default function SignalCard({ signal, onUpdateStatus, onSetDirection, onDelete, isAdmin }: SignalCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const formattedDate = signal.createdAt 
    ? new Date(signal.createdAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-- --- --:--';

  useEffect(() => {
    if (signal.status === 'pending') {
      setTimeLeft('--:--');
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = signal.expiry - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        clearInterval(timer);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [signal.expiry, signal.status]);

  const isExpired = signal.status === 'active' && signal.expiry < Date.now();
  const statusColor = {
    pending: 'text-yellow-400',
    active: 'text-red-400',
    win: 'text-green-400',
    loss: 'text-red-400',
    expired: 'text-gray-500',
  }[signal.status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 transition-all ${
        signal.status === 'pending' ? 'border-yellow-500/30 bg-yellow-500/5' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${
          signal.status === 'pending' 
            ? 'bg-yellow-500/10 text-yellow-500' 
            : signal.direction === 'CALL' 
              ? 'bg-green-500/10 text-green-500' 
              : 'bg-red-500/10 text-red-500'
        }`}>
          {signal.status === 'pending' ? (
            <HelpCircle size={24} className="animate-pulse" />
          ) : signal.direction === 'CALL' ? (
            <TrendingUp size={24} />
          ) : (
            <TrendingDown size={24} />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold font-mono">{signal.pair}</h3>
            {signal.type === 'vip' && (
              <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[8px] font-black uppercase tracking-tighter">
                VIP
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold uppercase ${statusColor}`}>
              {signal.status === 'pending' ? 'Waiting for Direction' : signal.status}
              {isExpired && signal.status === 'active' && ' (EXPIRED)'}
            </p>
            <span className="text-[10px] text-gray-500 font-mono border-l border-white/10 pl-2">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 md:px-8">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Direction</p>
          <p className={`font-bold ${
            signal.status === 'pending' 
              ? 'text-yellow-500/50 italic' 
              : signal.direction === 'CALL' ? 'text-green-500' : 'text-red-500'
          }`}>
            {signal.status === 'pending' ? '---' : signal.direction === 'CALL' ? 'BUY / CALL' : 'SELL / PUT'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Entry Price</p>
          <p className="font-mono font-bold text-white">{signal.entryPrice || 'MARKET'}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock size={12} /> Time Left
          </p>
          <p className={`text-lg font-mono font-black ${isExpired ? 'text-gray-600' : 'text-white'}`}>
            {timeLeft || '--:--'}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {isAdmin && signal.status === 'pending' && (
          <div className="flex gap-2 items-center bg-white/5 p-1 rounded-lg">
             <button
              onClick={() => onSetDirection?.(signal.id, 'CALL')}
              className="px-3 py-1 bg-green-500 text-white rounded text-[10px] font-bold hover:bg-green-600"
            >
              SET CALL
            </button>
            <button
              onClick={() => onSetDirection?.(signal.id, 'PUT')}
              className="px-3 py-1 bg-red-500 text-white rounded text-[10px] font-bold hover:bg-red-600"
            >
              SET PUT
            </button>
          </div>
        )}

        {isAdmin && signal.status === 'active' && (
          <>
            <button
              onClick={() => onUpdateStatus?.(signal.id, 'win')}
              className="p-2 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 transition-colors"
              title="Mark as Win"
            >
              <CheckCircle2 size={20} />
            </button>
            <button
              onClick={() => onUpdateStatus?.(signal.id, 'loss')}
              className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
              title="Mark as Loss"
            >
              <XCircle size={20} />
            </button>
            <button
              onClick={() => onUpdateStatus?.(signal.id, 'expired')}
              className="p-2 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors"
              title="Mark as Expired"
            >
              <AlertCircle size={20} />
            </button>
          </>
        )}

        {isAdmin && (
          <div className="relative">
            {showConfirmDelete ? (
              <div className="flex items-center gap-1 bg-red-500/10 rounded-lg p-1 border border-red-500/20">
                <button
                  onClick={() => {
                    onDelete?.(signal.id);
                    setShowConfirmDelete(false);
                  }}
                  className="px-2 py-1.5 bg-red-600 text-white rounded text-[8px] font-black uppercase"
                >
                  SURE?
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="p-1.5 text-gray-400 hover:text-white"
                >
                  <XCircle size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-500/20 active:scale-95"
                title="Delete Signal"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        )}

        {signal.status !== 'active' && signal.status !== 'pending' && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5">
            {signal.status === 'win' && <CheckCircle2 size={16} className="text-green-500" />}
            {signal.status === 'loss' && <XCircle size={16} className="text-red-500" />}
            {signal.status === 'expired' && <AlertCircle size={16} className="text-gray-500" />}
            <span className="text-xs uppercase font-bold text-gray-400">{signal.status}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
