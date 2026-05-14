import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, TrendingUp, CheckCircle2 } from 'lucide-react';

interface Review {
  id: string;
  username: string;
  imageUrl: string;
  comment?: string;
  profitAmount?: string;
  createdAt: string;
}

interface ReviewsSectionProps {
  isAdmin?: boolean;
}

interface ReviewCardProps {
  review: Review;
  isAdmin?: boolean;
  onDelete: (id: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, isAdmin, onDelete }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-panel border-white/5 overflow-hidden flex flex-col group relative"
    >
      <div className="aspect-video relative overflow-hidden bg-black/40">
        <img 
          src={review.imageUrl} 
          alt="Profit proof" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {review.profitAmount && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-green-500 text-white text-[10px] font-black rounded shadow-lg flex items-center gap-1">
            <TrendingUp size={12} />
            {review.profitAmount}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center text-red-500 font-black text-xs uppercase">
              {review.username.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-white uppercase flex items-center gap-1">
                {review.username}
                <CheckCircle2 size={10} className="text-blue-400" />
              </span>
              <span className="text-[8px] text-gray-500 font-mono uppercase">Verified Trader</span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1">
              {showConfirmDelete ? (
                <div className="flex items-center gap-2 bg-red-500/10 rounded px-2 py-1 border border-red-500/20">
                  <button 
                    onClick={() => onDelete(review.id)}
                    className="text-[8px] font-black text-red-500 uppercase hover:text-white"
                  >
                    SURE?
                  </button>
                  <button 
                    onClick={() => setShowConfirmDelete(false)}
                    className="text-[8px] font-black text-gray-500 uppercase hover:text-white"
                  >
                    NO
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                  title="Delete Review"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {review.comment && (
          <p className="text-[11px] text-gray-400 italic leading-relaxed">
            "{review.comment}"
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between text-[8px] font-mono text-gray-600 uppercase">
          <span>Community Proof</span>
          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function ReviewsSection({ isAdmin }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {reviews.map((review) => (
            <ReviewCard 
              key={review.id} 
              review={review} 
              isAdmin={isAdmin} 
              onDelete={handleDelete} 
            />
          ))}
        </AnimatePresence>
      </div>

      {reviews.length === 0 && (
        <div className="text-center p-12 glass-panel border-white/5">
          <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">No reviews published yet</p>
        </div>
      )}
    </div>
  );
}
