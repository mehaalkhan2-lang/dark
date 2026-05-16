import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <h1 className="text-xl font-black uppercase tracking-widest text-white mb-2">Neural Interface Crash</h1>
          <p className="text-xs text-gray-500 font-mono mb-8 max-w-xs uppercase leading-relaxed">
            The application encountered a terminal sequence error. Restoring system protocols may be required.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded transition-all shadow-xl shadow-red-500/20"
          >
            <RefreshCw size={14} />
            Reboot Interface
          </button>
          {this.state.error && (
             <div className="mt-8 p-4 bg-white/5 rounded border border-white/5 max-w-lg overflow-auto">
               <code className="text-[10px] text-red-400 font-mono block text-left">
                 {this.state.error.message}
               </code>
             </div>
          )}
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
