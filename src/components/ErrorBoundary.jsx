import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SIGS ErrorBoundary Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertOctagon className="w-8 h-8 flex-shrink-0" />
              <h2 className="text-xl font-bold">Ocorreu um erro na aplicação</h2>
            </div>
            
            <p className="text-sm text-zinc-300">
              Ocorreu um problema inesperado ao renderizar a tela.
            </p>

            {this.state.error && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs font-mono text-rose-300 overflow-x-auto max-h-48">
                <p className="font-bold mb-1">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-zinc-500 mt-2 text-[10px]">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-[#00796B] hover:bg-[#004D40] text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recarregar Aplicação</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
