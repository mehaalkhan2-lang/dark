import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, Chrome, PlusSquare, MoreVertical, X, Share, CheckCircle2 } from 'lucide-react';

interface AndroidInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AndroidInstallGuide({ isOpen, onClose }: AndroidInstallGuideProps) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  const steps = [
    {
      title: "Open in Chrome",
      description: "Ensure you are using Google Chrome on your Android device for the best experience.",
      icon: <Chrome className="text-blue-500" size={32} />,
      image: "https://images.unsplash.com/photo-1614332287897-cdc485fa562d?q=80&w=300&h=500&auto=format&fit=crop"
    },
    {
      title: "Open Menu",
      description: "Tap the three-dot menu icon (⋮) in the top right corner of your Chrome browser.",
      icon: <MoreVertical className="text-white" size={32} />,
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=300&h=500&auto=format&fit=crop"
    },
    {
      title: "Add to Home Screen",
      description: "Find and tap 'Add to Home screen' or 'Install app' from the list.",
      icon: <PlusSquare className="text-red-500" size={32} />,
      image: "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?q=80&w=300&h=500&auto=format&fit=crop"
    },
    {
      title: "Confirm Install",
      description: "Click 'Install' or 'Add' to place the Dark Trading icon on your home screen.",
      icon: <Download className="text-green-500" size={32} />,
      image: "https://images.unsplash.com/photo-1526406915844-3c66708682c6?q=80&w=300&h=500&auto=format&fit=crop"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-red-600/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              <Smartphone className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter">Android Installation</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Installer Version 2.0.4</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <div className="flex flex-col items-center">
             <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 bg-red-500/10 blur-xl animate-pulse" />
                <Download className="text-red-500" size={40} />
             </div>
             <h4 className="text-xl font-bold text-center mb-2">Secure Trading Node</h4>
             <p className="text-sm text-gray-400 text-center max-w-xs">
               Initialize the local terminal on your Android device for 0ms latency alerts.
             </p>
          </div>

          <div className="space-y-4">
             {steps.map((s, i) => (
                <div 
                  key={i}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                    step === i + 1 ? 'bg-white/5 border-red-500/30' : 'bg-transparent border-white/5 opacity-50'
                  }`}
                  onClick={() => setStep(i + 1)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    step === i + 1 ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h5 className={`text-sm font-bold uppercase tracking-tight mb-1 ${step === i + 1 ? 'text-white' : 'text-gray-500'}`}>
                      {s.title}
                    </h5>
                    {step === i + 1 && (
                      <motion.p 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-gray-400 leading-relaxed"
                      >
                        {s.description}
                      </motion.p>
                    )}
                  </div>
                  {step === i + 1 && (
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                      {s.icon}
                    </div>
                  )}
                </div>
             ))}
          </div>

          <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
             <div className="flex gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg h-fit">
                   <Share className="text-yellow-500" size={16} />
                </div>
                <div>
                   <h6 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">iOS User?</h6>
                   <p className="text-[10px] text-gray-500 leading-relaxed">
                     Tap the 'Share' icon in Safari (square with arrow up) and select 'Add to Home Screen'.
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/40">
           <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600 uppercase">
                <CheckCircle2 size={12} className="text-green-500" />
                Verified & Secure
              </div>
              <button 
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded hover:bg-red-600 hover:text-white transition-all active:scale-95"
              >
                GOT IT, LETS GO
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
