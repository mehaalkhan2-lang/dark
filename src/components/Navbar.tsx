import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Zap, LogOut, User as UserIcon, ShieldCheck, Download, Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface NavbarProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onVipClick: () => void;
  onBotClick: () => void;
  onReviewsClick: () => void;
  isAdmin: boolean;
  isVip: boolean;
  session?: { isActive: boolean };
}

export default function Navbar({ user, onLogin, onLogout, onVipClick, onBotClick, onReviewsClick, isAdmin, isVip, session }: NavbarProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const { permission, requestPermission, token, loading } = usePushNotifications();

  useEffect(() => {
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isChromeAndroid = /Chrome/.test(navigator.userAgent) && /Android/.test(navigator.userAgent);
      
      if (isIOS) {
        alert("IPHONE INSTALLATION:\n1. Open Safari\n2. Tap 'Share' (square with arrow)\n3. Tap 'Add to Home Screen'\n\nThis is REQUIRED for background notifications.");
      } else if (isChromeAndroid) {
        alert("ANDROID INSTALLATION:\n1. Tap the 3-dots menu (top right)\n2. Tap 'Install app' or 'Add to Home Screen'\n\nThe icon will appear on your desktop once finished.");
      } else {
        alert("INSTALLATION GUIDE:\n1. Click your Browser's Menu\n2. Select 'Install' or 'Add to Home Screen'\n\nThis turns the site into a high-performance standalone app.");
      }
      return;
    }
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    } catch (err) {
      console.error("Installation failed:", err);
    }
  };

  const handleToggleNotifications = async () => {
    const vapidKey = import.meta.env.VITE_VAPID_KEY;
    if (!vapidKey) {
      // Standard local notifications
      await requestPermission();
      return;
    }
    
    // Register for push notifications
    await requestPermission(vapidKey);
  };

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      alert("Push Token Copied! Use this in Firebase Console -> Messaging -> Send Test Message.");
    }
  };

  return (
    <nav className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-110 transition-transform">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic tracking-tighter leading-none mb-0.5">DARK TRADING</h1>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold tracking-[0.4em] text-red-500 uppercase leading-none">Global Network</span>
              {session?.isActive && (
                <span className="flex items-center gap-1 bg-green-500/10 text-green-500 border border-green-500/30 px-1 py-0.5 rounded-[2px] text-[7px] font-black uppercase tracking-widest animate-pulse">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  Live Session
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
              <button 
                onClick={handleToggleNotifications}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                  loading ? 'opacity-50 cursor-wait' : ''
                } ${
                  permission === 'granted' 
                    ? 'text-green-500 hover:bg-green-500/10' 
                    : permission === 'denied'
                      ? 'text-red-500 hover:bg-red-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 animate-pulse'
                }`}
                title={`Notifications: ${permission.toUpperCase()}`}
              >
                {permission === 'granted' ? <Bell size={16} /> : <BellOff size={16} />}
                <span className="text-[10px] font-black uppercase hidden sm:inline-block">
                  {permission === 'granted' ? 'Active' : 'Alerts'}
                </span>
              </button>
              {permission === 'granted' && (
                <button 
                  onClick={token ? handleCopyToken : handleToggleNotifications}
                  className={`ml-1 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all border ${
                    token 
                      ? 'bg-blue-600 border-blue-400/30 text-white hover:bg-blue-700' 
                      : 'bg-red-600 border-red-400/30 text-white hover:bg-red-700 animate-bounce'
                  }`}
                  title={token ? "Click to copy registration token" : "Token missing - click to retry generation"}
                >
                  {token ? 'Copy Token' : 'Get Token'}
                </button>
              )}
            </div>
              <button 
                onClick={handleInstall}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                  showInstallBtn 
                    ? 'bg-red-600 border-red-400/30 text-white hover:bg-red-700 shadow-red-600/20 animate-bounce' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
                title={showInstallBtn ? "Install Native App" : "App Installation Instructions"}
              >
                <Download size={14} />
                <span>{showInstallBtn ? 'Install Now' : 'Download App'}</span>
              </button>
            <button 
              onClick={onReviewsClick}
              className="hidden md:block text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
            >
              Reviews
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={onBotClick}
                className="hidden lg:block px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-red-500 hover:text-white transition-all"
              >
                DARK BOT
              </button>
              {!isVip && !isAdmin && (
                <button 
                  onClick={onVipClick}
                  className="hidden md:block px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-yellow-500 hover:text-black transition-all"
                >
                  GET VIP ACCESS
                </button>
              )}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1">
                  {isAdmin && <ShieldCheck size={12} className="text-red-500" />}
                  {isVip && !isAdmin && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />}
                  {user.displayName || user.email?.split('@')[0]}
                  {isVip && <span className="text-[8px] px-1 bg-yellow-500 text-black rounded ml-1">VIP</span>}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">{user.email}</span>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="text-xs font-bold uppercase tracking-widest hover:text-gray-400 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
