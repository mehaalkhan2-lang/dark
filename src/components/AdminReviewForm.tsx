import React, { useState, useRef } from 'react';
import { Camera, Send, X, User } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface AdminReviewFormProps {
  onSuccess?: () => void;
}

export default function AdminReviewForm({ onSuccess }: AdminReviewFormProps) {
  const [username, setUsername] = useState('');
  const [comment, setComment] = useState('');
  const [profitAmount, setProfitAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !imageUrl) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        username,
        comment,
        profitAmount,
        imageUrl,
        createdAt: new Date().toISOString(),
      });
      setUsername('');
      setComment('');
      setProfitAmount('');
      setImageUrl('');
      onSuccess?.();
    } catch (error) {
      console.error('Error adding review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 border-red-500/20 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <User size={18} className="text-red-500" />
        <h3 className="text-sm font-black uppercase tracking-widest text-white">Add Fake Review</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. TradingKing88"
            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-red-500/50 text-white"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Profit Amount (Optional)</label>
          <input
            type="text"
            value={profitAmount}
            onChange={(e) => setProfitAmount(e.target.value)}
            placeholder="e.g. +$1,240.00"
            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-red-500/50 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Comment (Optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a testimonial..."
          rows={3}
          className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-red-500/50 text-white resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Profit Screenshot</label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-video w-full rounded border-2 border-dashed border-white/10 hover:border-red-500/30 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden relative bg-black/40"
        >
          {imageUrl ? (
            <>
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setImageUrl(''); }}
                className="absolute top-2 right-2 p-1 bg-black/80 rounded-full text-white hover:text-red-500"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <Camera size={32} className="text-gray-600 mb-2" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center px-4">Click to upload profit screenshot</span>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden" 
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !username || !imageUrl}
        className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-600/20"
      >
        <Send size={16} />
        {isSubmitting ? 'PUBLISHING...' : 'PUBLISH REVIEW'}
      </button>
    </form>
  );
}
