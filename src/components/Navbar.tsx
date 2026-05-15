import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Zap, LogOut, User as UserIcon, ShieldCheck, Download, Bell, BellOff } from 'lucide-react';

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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert("IPHONE INSTALLATION:\n1. Open this page in Safari\n2. Tap the Share button (square with arrow)\n3. Scroll down and tap 'Add to Home Screen'");
      } else {
        alert("INSTALLATION GUIDE:\n1. Click the Browser Menu (3 dots)\n2. Select 'Install' or 'Add to Home Screen'\n\nThis turns Dark Trading into a fast, standalone app.");
      }
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const requestNotificationPermission = async () => {
    console.log("Requesting notification permission...");
    if (!('Notification' in window)) {
      console.error("This browser does not support notifications.");
      return;
    }

    try {
      // Some browsers require a user gesture, which we have here.
      const permission = await Notification.requestPermission();
      console.log("Permission result:", permission);
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        new Notification("Alerts Protocol Enabled", {
          body: "You will now receive notifications for live sessions and new signals.",
          icon: 'https://cdn-icons-png.flaticon.com/512/1055/1055644.png'
        });
      }
    } catch (err) {
      console.error("Failed to request notification permission:", err);
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
            <button 
              onClick={requestNotificationPermission}
              className={`p-2 rounded transition-all ${
                notificationPermission === 'granted' 
                  ? 'text-green-500 hover:bg-green-500/10' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 animate-pulse'
              }`}
              title={notificationPermission === 'granted' ? "Alerts Enabled" : "Enable Alerts"}
            >
              {notificationPermission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
            <button 
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 border border-red-400/30 rounded text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              title="Download Desktop/Mobile App"
            >
              <Download size={14} />
              <span>Download App</span>
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
