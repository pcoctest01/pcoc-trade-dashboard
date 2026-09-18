import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = { hasError: false, errorInfo: null };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('System Crash:', error, errorInfo);
    this.setState({ errorInfo: `${error.toString()}\n${errorInfo.componentStack}` });
  }

  handleReset = () => {
    localStorage.removeItem('ncr_cached_db');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl max-w-lg w-full border border-red-100 dark:border-red-900/40">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/40">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              ระบบขัดข้องชั่วคราว
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              เกิดข้อผิดพลาดในการเรนเดอร์ข้อมูล สามารถกดปุ่มด้านล่างเพื่อล้างแคชและเริ่มทำงานใหม่
            </p>
            <button
              onClick={this.handleReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              ล้างแคชและกู้คืนระบบ
            </button>
            {this.state.errorInfo && (
              <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-left overflow-auto max-h-36 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap">
                  {this.state.errorInfo}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
