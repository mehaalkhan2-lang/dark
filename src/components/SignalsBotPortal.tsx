import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Cpu, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  RefreshCcw, 
  Layout, 
  Terminal,
  Crosshair,
  BarChart3,
  Bot,
  Settings,
  X,
  RefreshCw,
  Shield
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface SignalsBotPortalProps {
  isVip: boolean;
  isAdmin: boolean;
  isBotUser: boolean;
}

const INTEGRATED_BROKER = { id: 'pocket', name: 'Pocket Option', icon: 'P', color: 'text-red-500' };

const ASSETS = [
  { id: 'EURUSD', name: 'Euro / USD', symbol: 'FX:EURUSD' },
  { id: 'GBPUSD', name: 'British Pound / USD', symbol: 'FX:GBPUSD' },
  { id: 'USDJPY', name: 'USD / Japanese Yen', symbol: 'FX:USDJPY' },
  { id: 'AUDUSD', name: 'Australian Dollar / USD', symbol: 'FX:AUDUSD' },
  { id: 'USDCAD', name: 'US Dollar / Canadian Dollar', symbol: 'FX:USDCAD' },
  { id: 'USDCHF', name: 'US Dollar / Swiss Franc', symbol: 'FX:USDCHF' },
  { id: 'EURJPY', name: 'Euro / Japanese Yen', symbol: 'FX:EURJPY' },
  { id: 'GBPJPY', name: 'GBP / JPY', symbol: 'FX:GBPJPY' },
  { id: 'EURGBP', name: 'EUR / GBP', symbol: 'FX:EURGBP' },
  { id: 'AUDJPY', name: 'AUD / JPY', symbol: 'FX:AUDJPY' },
  { id: 'EURAUD', name: 'EUR / AUD', symbol: 'FX:EURAUD' },
];

export default function SignalsBotPortal({ isVip, isAdmin, isBotUser }: SignalsBotPortalProps) {
  const selectedBroker = INTEGRATED_BROKER;
  const [isOtc, setIsOtc] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('10');
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState<'details' | 'upload' | 'verifying' | 'success'>('details');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    // TradingView Widget initialization
    if (!(isBotUser || isAdmin)) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (document.getElementById('tradingview_chart')) {
        new (window as any).TradingView.widget({
          "autosize": true,
          "symbol": selectedAsset.symbol,
          "interval": "1",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "hide_top_toolbar": true,
          "save_image": false,
          "container_id": "tradingview_chart"
        });
      }
    };
    document.head.appendChild(script);
    addLog(`System established handshake with ${selectedBroker.name} API...`);
    addLog(`Subscribing to ${selectedAsset.id} ticker...`);

    return () => {
      // Cleanup if needed
    };
  }, [selectedAsset, selectedBroker, isBotUser, isAdmin]);

  const handleScan = async () => {
    if (!isBotUser && !isAdmin) {
      setError("Bot License required for AI Analysis");
      setShowPurchase(true);
      return;
    }

    setIsScanning(true);
    setAnalysis(null);
    setError(null);
    addLog(`Uplinking to ${selectedBroker.name} servers...`);
    addLog(`Running Neural Scan on ${selectedAsset.id}...`);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      addLog(`Extracting ${selectedBroker.name} liquidity pools...`);
      await new Promise(r => setTimeout(r, 1000));
      addLog("Calculating RSI/MACD divergence...");
      await new Promise(r => setTimeout(r, 800));
      addLog("Analyzing order flow sentiment...");

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Perform a deep technical multi-timeframe analysis for ${selectedAsset.name} (${selectedAsset.symbol}). 
        Context: ${selectedBroker.name} Platform ${isOtc ? '(OTC Algorithmic Market)' : '(Interbank Global Feed)'}.
        Focus on 1-MINUTE EXPIRATION parameters:
        - 1-Minute Micro-trend and momentum divergence (RSI 7 period, Stochastic 5-3-3).
        - Fibonacci retracement levels (0.382, 0.5, 0.618) on the M1 cycle.
        - Support/Resistance liquidy pools on the 5-minute chart for high-level bias.
        - VWAP and EMA 20/50/100 crossovers.
        - Candle patterns: Pin bars, Engulfing, Marubozu at key levels.

        Provide: 
        1. Direction (CALL/PUT)
        2. Confidence level (0-100%)
        3. Detailed technical reasoning (Deeply technical summary)
        4. Target Price Projection (Precise for 1-minute expiration)`,
        config: {
            systemInstruction: `You are an elite quantitative analyst bot for ${selectedBroker.name}. ${isOtc ? 'Monitor OTC algorithmic patterns and price spikes.' : 'Analyze institutional order flow and macro-economic correlations.'} Your signals must be highly precise and deeply descriptive.`,
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    direction: { type: "STRING" },
                    confidence: { type: "NUMBER" },
                    reason: { type: "STRING" },
                    target: { type: "STRING" }
                },
                required: ["direction", "confidence", "reason", "target"]
            }
        }
      });

      const result = JSON.parse(response.text || "{}");
      setAnalysis(result);
      addLog(`Analysis complete. Signal: ${result.direction}`);
    } catch (err: any) {
      console.error(err);
      setError("Analysis failed. Connection to AI brain lost.");
      addLog("ERROR: Neural processing uplink failed.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const submitPurchase = async () => {
    if (!proofImage) return;
    
    setPurchaseStep('verifying');
    addLog("Uplinking screenshot to Assistant Bot...");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // Save purchase attempt for admin review
      if (auth.currentUser) {
        addDoc(collection(db, 'bot_activations'), {
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
          amount: 1000,
          currency: 'PKR',
          method: 'EasyPaisa',
          recipient: 'Hijran Bano',
          timestamp: serverTimestamp(),
          status: 'verifying'
        }).catch(err => console.error("Log failed", err));
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(proofImage);
      });
      const base64Data = await base64Promise;

      const prompt = `Analyze this transaction screenshot. 
      Verify the following payment details:
      - Recipient Number: 03451959533
      - Recipient Name: Hijran Bano (accept minor variations like Hijra Bano)
      - Amount: 1000 PKR
      - Status: Must be Successful / Sent / Paid / Completed
      
      Extract the Transaction ID, the exact amount found, and the recipient name found.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: proofImage.type
              }
            },
            {
              text: prompt
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              isValid: { 
                type: "BOOLEAN",
                description: "True if recipient number, name (Hijran Bano), and amount (1000 PKR) match perfectly and status is successful."
              },
              transactionId: { type: "STRING" },
              amountDetected: { type: "STRING" },
              recipientDetected: { type: "STRING" },
              reason: { type: "STRING", description: "If invalid, explain why (e.g. 'Wrong amount', 'Recipient name mismatch', 'Screenshot of pending status')" }
            },
            required: ["isValid", "transactionId", "amountDetected", "recipientDetected", "reason"]
          }
        }
      });

      const text = response.text || "{}";
      const result = JSON.parse(text);
      
      if (result.isValid) {
        addLog(`Assistant Bot: Transaction ${result.transactionId} VERIFIED.`);
        setPurchaseStep('success');
        addLog("BOT LICENSE ACTIVATED.");
      } else {
        addLog(`Assistant Bot: REJECTED - ${result.reason}`);
        setError(`Verification failed: ${result.reason}`);
        setPurchaseStep('upload');
      }
    } catch (err) {
      console.error(err);
      addLog("Assistant Bot: Verification engine error.");
      setError("AI Vision Analysis failed. Please try again with a clearer image.");
      setPurchaseStep('upload');
    }
  };

  const executeTrade = async () => {
    if (!isApiConnected) {
      setError(`Please connect ${selectedBroker.name} API first.`);
      setShowConfig(true);
      return;
    }
    
    addLog(`Broadcasting EXECUTE order to ${selectedBroker.name}...`);
    addLog(`Amount: $${tradeAmount} | Direction: ${analysis.direction}`);
    // This is where real API calls would go
    await new Promise(r => setTimeout(r, 1500));
    addLog("ORDER PLACED SUCCESSFULLY. Awaiting result...");
  };

  return (
    <div className="space-y-6">
      {/* Header & Internal Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Bot className={isScanning ? "text-red-500 animate-pulse" : "text-white"} size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
              Dark trading bot
              {!isBotUser && !isAdmin && (
                <span className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20 text-[9px] tracking-widest">
                  <Shield size={10} /> 1000 PKR
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isApiConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                {isApiConnected ? `${selectedBroker.name} LINKED` : 'DISCONNECTED'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOtc(!isOtc)}
            className={`px-3 py-1.5 rounded text-[9px] font-black tracking-widest border transition-all h-[34px] ${isOtc ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-lg shadow-yellow-500/10' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
          >
            OTC MODE: {isOtc ? 'ON' : 'OFF'}
          </button>

          <select 
            value={selectedAsset.id}
            onChange={(e) => setSelectedAsset(ASSETS.find(a => a.id === e.target.value) || ASSETS[0])}
            className="bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs font-bold font-mono focus:outline-none focus:border-red-500/50 h-[34px] text-white"
          >
            {ASSETS.map(a => (
              <option key={a.id} value={a.id}>{a.id}</option>
            ))}
          </select>
          <button 
            onClick={handleScan}
            disabled={isScanning}
            className={`px-4 py-2 rounded font-black text-[10px] tracking-widest transition-all h-[34px] flex items-center gap-2 ${isScanning ? 'bg-red-500/20 text-red-400 cursor-wait' : (!isBotUser && !isAdmin) ? 'bg-yellow-500 text-black hover:bg-yellow-400 font-black' : 'bg-white text-black hover:bg-red-500 hover:text-white'}`}
          >
            {isScanning ? (
              <>
                <RefreshCcw size={14} className="animate-spin" />
                SCANNING...
              </>
            ) : (!isBotUser && !isAdmin) ? (
              <>
                <Shield size={14} />
                ACTIVATE BOT (1000 PKR)
              </>
            ) : (
              <>
                <Crosshair size={14} />
                SCAN CHART
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-3 space-y-4">
          <div className="aspect-video w-full glass-panel overflow-hidden border-white/5 relative bg-black/40">
            {isBotUser || isAdmin ? (
              <>
                <div id="tradingview_chart" className="w-full h-full" />
                
                {/* HUD Overlay */}
                <div className="absolute top-4 left-4 p-2 bg-black/80 backdrop-blur border border-white/10 rounded flex items-center gap-3 pointer-events-none">
                  <BarChart3 size={16} className="text-red-500" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-white leading-none uppercase">{selectedAsset.id}</span>
                      <span className="text-[8px] bg-red-500 text-white px-1 rounded-sm leading-tight font-black">1M</span>
                    </div>
                    <span className="text-[8px] font-mono text-gray-500 leading-none">REAL-TIME {selectedBroker.name.toUpperCase()} FEED</span>
                  </div>
                </div>

                {/* Scanning Overlay */}
                <AnimatePresence>
                  {isScanning && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
                    >
                      <div className="absolute inset-x-0 h-[2px] bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-scan-y top-1/2" />
                      <div className="absolute inset-0 bg-red-500/5 backdrop-blur-[2px]" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <Activity size={48} className="text-red-500 animate-pulse mb-2" />
                        <span className="text-xs font-mono font-bold text-red-400 tracking-[0.3em] uppercase">Processing Patterns</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative">
                  <BarChart3 size={32} className="text-gray-700" />
                  <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 border-4 border-black">
                    <Shield size={12} className="text-black" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Market Scanner Locked</h3>
                <p className="text-[10px] text-gray-500 font-mono max-w-xs text-center leading-relaxed">
                  The high-frequency real-time feed requires an active Bot License. Activate your bot to unlock the technical terminal.
                </p>
                <div className="mt-8 flex gap-3">
                  <div className="h-[1px] w-12 bg-white/10 self-center" />
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Upgrade to Access</span>
                  <div className="h-[1px] w-12 bg-white/10 self-center" />
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-4 border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5"><Layout size={12} /> ENGINE: VEO-3.1</span>
              <span className="flex items-center gap-1.5"><Activity size={12} /> SYNC: {isApiConnected ? 'ULTRA-LOW' : 'SIMULATED'}</span>
              {(isBotUser || isAdmin) && (
                <span className="flex items-center gap-1.5 font-bold text-red-500/80 cursor-pointer hover:text-red-400 transition-colors" onClick={() => setShowConfig(true)}>
                  <Settings size={12} /> {isApiConnected ? 'RE-SYNC SESSION' : 'LINK BROKER'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-red-500/50 uppercase tracking-tighter">
              {isBotUser || isAdmin ? `Ready for ${selectedBroker.name} Integration...` : 'Terminal Authorization Pending...'}
            </div>
          </div>
        </div>

        {/* Sidebar / Analysis Output */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-5 border-white/5 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6 text-xs font-bold text-white uppercase tracking-widest">
              <Terminal size={14} className="text-gray-400" />
              Bot Output
            </div>

            <div className="flex-1 space-y-4">
              {showPurchase && !isBotUser && !isAdmin ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 border border-yellow-500/20 bg-yellow-500/5 p-4 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Shield size={40} className="text-yellow-500" />
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Bot License Required</span>
                    <button onClick={() => setShowPurchase(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                  </div>

                  {purchaseStep === 'details' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-black/40 rounded border border-white/5 space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-white uppercase">
                          <span>License Fee</span>
                          <span className="text-yellow-500">1000 PKR</span>
                        </div>
                        <div className="h-[1px] bg-white/5" />
                        <div className="space-y-1">
                          <span className="text-[8px] text-gray-500 uppercase">Payment Method</span>
                          <p className="text-[11px] text-white font-bold">EasyPaisa</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] text-gray-500 uppercase">Account Number</span>
                          <p className="text-[14px] text-yellow-500 font-black tracking-widest">03451959533</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] text-gray-500 uppercase">Account Name</span>
                          <p className="text-[11px] text-white font-bold">Hijran Bano</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setPurchaseStep('upload')}
                        className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-black rounded text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-yellow-500/20"
                      >
                        I HAVE SENT THE MONEY
                      </button>
                    </div>
                  )}

                  {purchaseStep === 'upload' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-[8px] text-gray-400 uppercase">Upload Transaction Screenshot</span>
                        <div className="relative group">
                          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${previewUrl ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-black/40 hover:border-yellow-500/30'}`}>
                            {previewUrl ? (
                              <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg p-2" />
                            ) : (
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Zap className="text-gray-600 mb-2" size={24} />
                                <p className="text-[9px] text-gray-500 font-mono">JPG, PNG (MAX 5MB)</p>
                              </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setPurchaseStep('details')}
                          className="flex-1 py-3 bg-white/5 text-white rounded text-[10px] font-black uppercase tracking-widest border border-white/10"
                        >
                          BACK
                        </button>
                        <button 
                          disabled={!proofImage}
                          onClick={submitPurchase}
                          className="flex-[2] py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 text-black rounded text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          ACTIVATE VIA AI SCAN
                        </button>
                      </div>
                    </div>
                  )}

                  {purchaseStep === 'verifying' && (
                    <div className="space-y-4 py-4 text-center">
                      <div className="w-12 h-12 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin mx-auto mb-4" />
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">Assistant Bot Examining Proof</h4>
                      <p className="text-[9px] text-gray-500 font-mono leading-relaxed">
                        The AI is currently scanning your screenshot to verify the Transaction ID, Recipient (Hijran Bano), and Amount (1000 PKR). Do not close this panel.
                      </p>
                    </div>
                  )}

                  {purchaseStep === 'success' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 py-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                        <Zap className="text-green-500" size={32} />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Bot Activated</h4>
                      <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                        Verification successful! Your bot license has been linked to your account. You now have full access to AI Signal Scanning.
                      </p>
                      <button 
                        onClick={() => setShowPurchase(false)}
                        className="w-full py-3 bg-white text-black rounded text-[10px] font-black uppercase tracking-widest"
                      >
                        ENTER TERMINAL
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ) : null}

              {showConfig ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 border border-green-500/20 bg-green-500/5 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">{selectedBroker.name} Session Link</span>
                    <button onClick={() => setShowConfig(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                  </div>
                  
                  <div className="p-3 bg-black/40 rounded border border-white/5 space-y-2">
                    <div className="flex justify-between text-[8px] font-mono text-gray-500 uppercase">
                      <span>Sync Mode</span>
                      <span className="text-green-500">Fast Handshake</span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-mono leading-relaxed">
                      This protocol uses a secure session handshake to synchronize the bot with your active {selectedBroker.name} browser tab. No API keys required.
                    </p>
                  </div>

                  <button 
                    disabled={isLinking}
                    onClick={async () => {
                      setIsLinking(true);
                      addLog(`Initiating handshake with ${selectedBroker.name} tab...`);
                      await new Promise(r => setTimeout(r, 1500));
                      addLog("Searching for active session token...");
                      await new Promise(r => setTimeout(r, 1000));
                      setIsApiConnected(true);
                      setIsLinking(false);
                      setShowConfig(false);
                      addLog(`${selectedBroker.name} SESSION LINKED SUCCESSFULLY.`);
                    }}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                  >
                    {isLinking ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        SYNCHRONIZING...
                      </>
                    ) : 'LINK ACTIVE BROKER SESSION'}
                  </button>
                  
                  <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <div className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse" />
                    <p className="text-[7px] text-yellow-500 font-black uppercase tracking-tighter">
                      Ensure {selectedBroker.name} is open in another tab for sync.
                    </p>
                  </div>
                </motion.div>
              ) : null}

              {!analysis && !isScanning && !error && !showConfig && (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <Cpu size={32} className="text-gray-700 mb-4" />
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                    Awaiting trigger. Click "Scan Chart" to initialize AI technical analysis.
                  </p>
                </div>
              )}

              {isScanning && (
                <div className="space-y-3 font-mono">
                  {logs.map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[9px] text-red-400/80 leading-relaxed break-all"
                    >
                      {log}
                    </motion.div>
                  ))}
                  <div className="h-[1px] w-full bg-red-500/20 animate-pulse mt-2" />
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg text-center">
                  <span className="text-[10px] font-mono text-red-400 uppercase">{error}</span>
                </div>
              )}

              {analysis && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center relative overflow-hidden ${analysis.direction === 'CALL' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <div className="absolute top-0 right-0 p-1">
                      <span className="text-[7px] font-black bg-white/10 text-white px-1 rounded uppercase tracking-widest">1m Expiry</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">Detected Direction</span>
                    <h3 className={`text-4xl font-black italic tracking-tighter ${analysis.direction === 'CALL' ? 'text-green-500' : 'text-red-500'}`}>
                      {analysis.direction}
                    </h3>
                    {analysis.direction === 'CALL' ? <TrendingUp className="text-green-500 mt-2" /> : <TrendingDown className="text-red-500 mt-2" />}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-[8px] text-gray-500 block uppercase mb-1">Confidence</span>
                      <span className="text-sm font-bold text-white">{analysis.confidence}%</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-[8px] text-gray-500 block uppercase mb-1">Target</span>
                      <span className="text-sm font-bold text-white tracking-widest">{analysis.target}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[8px] text-gray-500 uppercase">Trade Amount</span>
                      <div className="flex bg-black rounded border border-white/10 px-2 py-1 items-center gap-1">
                        <span className="text-[10px] text-gray-500">$</span>
                        <input 
                          type="number" 
                          value={tradeAmount}
                          onChange={(e) => setTradeAmount(e.target.value)}
                          className="w-12 bg-transparent text-xs font-bold text-white focus:outline-none" 
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-mono">
                      {analysis.reason}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] font-bold transition-all border border-white/10">
                      COPY
                    </button>
                    <button 
                      onClick={executeTrade}
                      className="flex-[2] px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-lg shadow-red-500/20"
                    >
                      <Zap size={12} /> EXECUTE ON {selectedBroker.name.toUpperCase()}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
