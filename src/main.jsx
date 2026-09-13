import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { WatchlistProvider } from './context/WatchlistContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b09] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center mb-4 border border-amber-500/30">
            <span className="text-2xl font-black">⚡</span>
          </div>
          <h1 className="text-2xl font-bold font-display mb-2">AniSphere Player Refreshed</h1>
          <p className="text-sm text-gray-400 max-w-md mb-6">
            Click below to reload your streams smoothly.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-[#0a0f0c] font-bold text-sm shadow-xl shadow-amber-600/30 transition-all hover:scale-105"
          >
            Reload AniSphere
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <WatchlistProvider>
          <App />
        </WatchlistProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
