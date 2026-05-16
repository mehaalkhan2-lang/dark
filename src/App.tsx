import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where,
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  serverTimestamp,
  setDoc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, login, logout, OperationType, handleFirestoreError } from './lib/firebase';
import { Signal, TradeDirection } from './types';
import Navbar from './components/Navbar';
import AdminSignalForm from './components/AdminSignalForm';
import SignalCard from './components/SignalCard';
import SignalsBotPortal from './components/SignalsBotPortal';
import AdminReviewForm from './components/AdminReviewForm';
import ReviewsSection from './components/ReviewsSection';
import SupportAssistant from './components/SupportAssistant';
import { useNotifications } from './hooks/useNotifications';
import ErrorBoundary from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, AlertCircle, XCircle, User as UserIcon, Activity } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [isBotUser, setIsBotUser] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [pushTokens, setPushTokens] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'public' | 'vip' | 'bot' | 'reviews'>('public');
  const [session, setSession] = useState<any>(null);
  const [activeNotification, setActiveNotification] = useState<{ title: string; body: string } | null>(null);

  useNotifications(signals, session, (notif) => {
    setActiveNotification(notif);
    setTimeout(() => setActiveNotification(null), 5000);
  });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const [adminDoc, vipDoc, botDoc] = await Promise.all([
            getDoc(doc(db, 'admins', u.uid)),
            getDoc(doc(db, 'vips', u.uid)),
            getDoc(doc(db, 'bot_access', u.uid))
          ]);
          const isUserAdmin = adminDoc.exists();
          setIsAdmin(isUserAdmin);
          setIsVip(isUserAdmin || vipDoc.exists());
          setIsBotUser(isUserAdmin || botDoc.exists());
        } catch (err) {
          console.error("Access check failed", err);
          setIsAdmin(false);
          setIsVip(false);
          setIsBotUser(false);
        }
      } else {
        setIsAdmin(false);
        setIsVip(false);
        setIsBotUser(false);
      }
      setLoading(false);
    });

    // Safety timeout: if auth takes too long, stop loading and show whatever we can
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    return () => {
      unsubAuth();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    let q;
    if (isAdmin || isVip) {
      // Admins and VIPs see all signals
      q = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
    } else {
      // Guests and regular users see only public signals
      // Note: This requires a composite index on 'type' and 'createdAt'. 
      // If none exists, this will fail. We use a fallback if needed.
      q = query(
        collection(db, 'signals'), 
        where('type', '==', 'public'), 
        orderBy('createdAt', 'desc')
      );
    }

    const unsubSignals = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiry: doc.data().expiry?.toMillis?.() || doc.data().expiry, // Handle both timestamp and number
        activatedAt: doc.data().activatedAt?.toMillis?.() || doc.data().activatedAt,
        createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt,
      } as Signal));
      setSignals(data);
      if (error?.includes("sync")) setError(null);
    }, (err) => {
      console.warn("Signals sync issue:", err);
      // Handle index missing error specifically
      if (err.message.includes("index")) {
        setError("Database indexing in progress. Feed will activate shortly.");
      } else if (err.message.includes("permission") || err.message.includes("offline")) {
        // Silent warning for transient connection issues
      } else {
        setError(`Data sync restricted: ${err.message}`);
      }
    });

    return () => unsubSignals();
  }, [user, isAdmin, isVip, loading]);

  useEffect(() => {
    const unsubSession = onSnapshot(doc(db, 'system', 'trading_session'), (snapshot) => {
      if (snapshot.exists()) {
        setSession(snapshot.data());
      } else {
        setSession({ isActive: false });
      }
    }, (err) => {
      console.error("Session sync failed:", err);
    });

    return () => unsubSession();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setAllUsers([]);
      return;
    }

    const unsubVips = onSnapshot(collection(db, 'vips'), (snapshot) => {
      const vips = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(vips);
    }, (err) => {
      console.error("VIPs sync failed:", err);
    });

    const unsubTokens = onSnapshot(collection(db, 'push_tokens'), (snapshot) => {
      const tokens: Record<string, boolean> = {};
      snapshot.docs.forEach(doc => {
        tokens[doc.id] = doc.data().active !== false;
      });
      setPushTokens(tokens);
    }, (err) => {
      console.error("Tokens sync failed:", err);
    });

    return () => {
      unsubVips();
      unsubTokens();
    };
  }, [isAdmin]);

  const handleAddSignal = async ({ pair, direction, entryPrice, expiryMinutes, status, type }: any) => {
    if (!user || !isAdmin) return;
    const path = 'signals';
    try {
      const payload: any = {
        pair,
        expiry: status === 'active' 
          ? new Date(Date.now() + expiryMinutes * 60000) 
          : new Date(Date.now() + 86400000), // 24h placeholder for pending
        durationMinutes: expiryMinutes,
        type,
        status,
        createdAt: serverTimestamp(),
        authorId: user.uid
      };
      if (entryPrice) {
        payload.entryPrice = entryPrice;
      }
      if (direction) {
        payload.direction = direction;
      }
      const docRef = await addDoc(collection(db, path), payload);
      console.log("Signal created with ID:", docRef.id);
      setError(null);
      return docRef;
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, path);
      } catch (e: any) {
        setError(e.message);
      }
      throw err;
    }
  };

  const handleJoinVip = async () => {
    if (!user) return;
    const path = `vips/${user.uid}`;
    try {
      await setDoc(doc(db, 'vips', user.uid), {
        email: user.email,
        joinedAt: serverTimestamp()
      });
      setIsVip(true);
      setError(null);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  const handleToggleVip = async (userId: string, currentStatus: boolean) => {
    if (!isAdmin) return;
    const path = `vips/${userId}`;
    try {
      if (currentStatus) {
        await deleteDoc(doc(db, 'vips', userId));
      } else {
        await setDoc(doc(db, 'vips', userId), {
          email: 'User',
          joinedAt: serverTimestamp()
        });
      }
      setError(null);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  const handleToggleSignalSession = async () => {
    if (!isAdmin) return;
    const path = 'system/trading_session';
    try {
      const newStatus = !session?.isActive;
      await setDoc(doc(db, 'system', 'trading_session'), {
        isActive: newStatus,
        startedAt: newStatus ? serverTimestamp() : session?.startedAt,
        closedAt: newStatus ? null : serverTimestamp(),
        lastStatus: newStatus ? 'LIVE' : 'CLOSED'
      }, { merge: true });
      setError(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleUpdateStatus = async (id: string, status: Signal['status']) => {
    if (!user || !isAdmin) return;
    const path = `signals/${id}`;
    try {
      await updateDoc(doc(db, 'signals', id), { status });
      setError(null);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  const handleSetDirection = async (id: string, direction: TradeDirection) => {
    if (!user || !isAdmin) return;
    const path = `signals/${id}`;
    try {
      // Find the signal to get its duration
      const signal = signals.find(s => s.id === id);
      if (!signal) return;

      await updateDoc(doc(db, 'signals', id), { 
        direction,
        status: 'active',
        activatedAt: serverTimestamp(),
        expiry: new Date(Date.now() + signal.durationMinutes * 60000)
      });
      setError(null);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  const handleDeleteSignal = async (id: string) => {
    if (!user || !isAdmin) return;
    const path = `signals/${id}`;
    try {
      await deleteDoc(doc(db, 'signals', id));
      setError(null);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  const bootstrapAdmin = async () => {
    if (!user || user.email !== "mehaalkhan.2@gmail.com") return;
    try {
      await setDoc(doc(db, 'admins', user.uid), {
        email: user.email,
        uid: user.uid
      });
      setIsAdmin(true);
      setError(null);
    } catch (err) {
      setError("Bootstrapping failed. Check console or rules.");
    }
  };

  if (error && error.includes("Neural interface error")) {
     // Don't crash for AI errors, just show them in the sidebar if needed
     // But for now, let's keep the global error state for logic-breaking errors
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-6 text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-pulse">
            <Zap size={40} className="text-white fill-white" />
          </div>
          <div className="absolute inset-0 bg-red-500/20 blur-xl animate-ping rounded-full" />
        </div>
        <div className="space-y-4">
          <h1 className="text-xl font-black tracking-widest uppercase italic text-white">Initializing Network</h1>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] animate-pulse">Neural Handshake in progress...</p>
            <p className="text-[8px] font-mono text-red-900 uppercase">Synchronizing with interbank servers</p>
          </div>
        </div>
        
        {/* Connection Failure Recovery */}
        <div className="fixed bottom-12 text-center opacity-40 hover:opacity-100 transition-opacity">
           <p className="text-[8px] text-gray-700 font-mono mb-2 uppercase">Taking too long?</p>
           <button 
             onClick={() => window.location.reload()}
             className="text-[9px] font-black text-red-500 underline underline-offset-4 tracking-widest uppercase"
           >
             Hard Reset Uplink
           </button>
        </div>
      </div>
    );
  }

  // Basic Error display for crashes
  if (error && (error.includes("permission") || error.includes("sync"))) {
    // We already handle this in the UI below, but if it's catastrophic:
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
        <Navbar 
          user={user} 
          onLogin={login} 
          onLogout={logout} 
          isAdmin={isAdmin} 
          isVip={isVip} 
          session={session}
          onVipClick={() => setActiveTab('vip')}
          onBotClick={() => setActiveTab('bot')}
          onReviewsClick={() => setActiveTab('reviews')}
        />

        <main className="max-w-5xl mx-auto px-4 py-12">
          {user?.email === "mehaalkhan.2@gmail.com" && !isAdmin && (
            <div className="mb-8 p-6 glass-panel border-dashed border-red-500/50 bg-red-500/5">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Shield className="text-red-500" /> Administrative Access Required
              </h3>
              <p className="text-gray-400 mb-4">
                You are recognized as the developer. Click below to initialize your admin profile and access the Control Panel.
              </p>
              <button onClick={bootstrapAdmin} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-all">
                INITIALIZE ADMIN ROLE
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="mb-12 space-y-6">
              <div className="glass-panel p-6 border-white/5 bg-gradient-to-r from-red-500/5 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${session?.isActive ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    <Activity size={24} className={session?.isActive ? 'animate-pulse' : ''} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Market Protocol</h3>
                    <p className="text-[10px] font-mono text-gray-500 uppercase">
                      Status: <span className={session?.isActive ? 'text-green-500' : 'text-red-500'}>{session?.isActive ? 'SESSION LIVE' : 'SESSION CLOSED'}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleSignalSession}
                  className={`px-8 py-3 rounded text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${session?.isActive ? 'bg-white text-black hover:bg-red-500 hover:text-white' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20'}`}
                >
                  {session?.isActive ? 'STOP GLOBAL SESSION' : 'START GLOBAL SESSION'}
                </button>
              </div>

              <AdminSignalForm onAddSignal={handleAddSignal} />
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-xs flex items-start gap-3">
                <Zap size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 text-red-200/70">
                  <p className="font-bold text-red-400">ADMIN CONTROL PANEL ACTIVE</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Use the <strong>PUBLIC / VIP</strong> toggle in the form above to target different audiences.</li>
                    <li><strong>VIP Portal:</strong> Currently locked for guests. Click "JOIN VIP NOW" as a non-admin user to test.</li>
                    <li><strong>Registry:</strong> Manage VIP memberships at the bottom of the page.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
            <div className="flex flex-col gap-4 w-full">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Zap size={24} className="text-red-500" />
                Live Monitoring
              </h2>
              <div className="flex gap-6 border-b border-white/5 overflow-x-auto scrollbar-hide whitespace-nowrap pb-1">
                <button
                  onClick={() => setActiveTab('public')}
                  className={`pb-2 px-1 text-xs font-bold uppercase tracking-widest transition-all relative shrink-0 ${activeTab === 'public' ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  PUBLIC SIGNALS
                  {activeTab === 'public' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500 rounded-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('vip')}
                  className={`pb-2 px-1 text-xs font-bold uppercase tracking-widest transition-all relative shrink-0 ${activeTab === 'vip' ? 'text-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  VIP SIGNALS
                  {activeTab === 'vip' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-yellow-500 rounded-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('bot')}
                  className={`pb-2 px-1 text-xs font-bold uppercase tracking-widest transition-all relative shrink-0 ${activeTab === 'bot' ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  DARK TRADING BOT
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-2 px-1 text-xs font-bold uppercase tracking-widest transition-all relative shrink-0 ${activeTab === 'reviews' ? 'text-green-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  REVIEWS
                  {activeTab === 'reviews' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-500 rounded-full" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 bg-white/5 p-2 rounded-lg border border-white/5 md:bg-transparent md:border-0 md:p-0">
              <div className="flex items-center gap-1.5 border-r border-white/10 pr-4">
                <UserIcon size={14} />
                <span className="font-bold">1,005</span>
              </div>
              <div className="flex items-center gap-2 text-green-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                LIVE
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {!user && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="mb-12 p-8 glass-panel text-center border-white/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3">
                <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded text-[10px] font-black text-red-500 uppercase tracking-widest">
                  <UserIcon size={12} />
                  ENTRY GRANTED
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2 uppercase tracking-wider">Welcome to Dark Trading Network</h3>
              <p className="text-gray-400 text-sm mb-0">
                You are currently in observer mode. Login to receive personalized trade alerts.
              </p>
            </motion.div>
          )}

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {activeTab === 'bot' ? (
                <motion.div
                  key="bot-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SignalsBotPortal isVip={isVip} isAdmin={isAdmin} isBotUser={isBotUser} session={session} />
                </motion.div>
              ) : activeTab === 'reviews' ? (
                <motion.div
                  key="reviews-tab"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  {isAdmin && <AdminReviewForm />}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-[1px] flex-1 bg-white/5" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Community Results</span>
                    <div className="h-[1px] flex-1 bg-white/5" />
                  </div>
                  <ReviewsSection isAdmin={isAdmin} />
                </motion.div>
              ) : activeTab === 'vip' && !isVip && !isAdmin ? (
                <motion.div
                  key="vip-locked"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-24 glass-panel border-dashed border-yellow-500/30"
                >
                  <div className="bg-yellow-500/10 text-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield size={32} />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">VIP Portal Locked</h3>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm">
                    This section is reserved for VIP members only. Gain access to premium signals and advanced market analytics.
                  </p>
                  <button 
                    className="px-8 py-3 bg-yellow-500 text-black font-black uppercase tracking-widest text-xs rounded hover:bg-yellow-400 transition-all active:scale-95 shadow-lg shadow-yellow-500/20"
                    onClick={handleJoinVip}
                  >
                    JOIN VIP NOW
                  </button>
                </motion.div>
              ) : signals.filter(s => s.type === activeTab).length === 0 ? (
                <motion.div 
                  key={`empty-${activeTab}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 border border-dashed border-white/10 rounded-2xl"
                >
                  <p className="text-gray-500 font-mono">WAITING FOR NEXT {activeTab.toUpperCase()} SIGNAL...</p>
                </motion.div>
              ) : (
                signals.filter(s => s.type === activeTab).map(signal => (
                  <SignalCard 
                    key={signal.id} 
                    signal={signal} 
                    isAdmin={isAdmin}
                    onUpdateStatus={handleUpdateStatus}
                    onSetDirection={handleSetDirection}
                    onDelete={handleDeleteSignal}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          {isAdmin && (
            <div className="mt-12 glass-panel p-6 border-yellow-500/10">
              <h2 className="text-lg font-bold uppercase tracking-widest text-white mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-yellow-500" />
                  VIP Member Registry
                </div>
                <span className="text-[10px] font-mono text-gray-500">{allUsers.length} MEMBERS</span>
              </h2>
              {allUsers.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/5 rounded-lg">
                  <p className="text-xs text-gray-500 font-mono">NO VIP MEMBERS FOUND</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-1.5 rounded-full ${pushTokens[u.id] ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`} title={pushTokens[u.id] ? "Push Notifications Active" : "No Push Token Registered"}>
                          <Activity size={14} className={pushTokens[u.id] ? 'animate-pulse' : ''} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white truncate">{u.email}</span>
                          <span className="text-[10px] text-gray-500 font-mono">Member Since: {u.joinedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { if(window.confirm(`Revoke VIP for ${u.email}?`)) handleToggleVip(u.id, true) }}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-2 flex-shrink-0"
                        title="Revoke VIP Status"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-white/5 text-center text-gray-600 text-xs font-mono uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Dark Trading Network. All rights reserved.
        </footer>

        <SupportAssistant />

        {/* WhatsApp Style Toast Notification */}
        <AnimatePresence>
          {activeNotification && (
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 20 }}
              exit={{ opacity: 0, y: -100 }}
              className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none"
            >
              <div className="bg-[#202c33] border-l-4 border-[#00a884] shadow-2xl rounded-lg p-3 flex items-center gap-4 max-w-md w-full pointer-events-auto border border-white/5">
                <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <Zap size={20} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#00a884] text-[10px] font-black uppercase tracking-widest mb-0.5">Alert Protocol</h4>
                  <p className="text-white text-xs font-bold truncate">{activeNotification.title}</p>
                  <p className="text-gray-400 text-[10px] truncate">{activeNotification.body}</p>
                </div>
                <button 
                  onClick={() => setActiveNotification(null)}
                  className="text-gray-500 hover:text-white p-1"
                >
                  <XCircle size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
