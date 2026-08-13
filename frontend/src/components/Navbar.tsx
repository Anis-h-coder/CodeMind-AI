import { Link } from 'react-router-dom';
import { Cpu, LogOut, ArrowRight, Github } from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-[#06080F]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-purple-600 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <Cpu size={16} className="text-cyan-400" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-base font-bold tracking-tight text-white">
            <span>CodeMind</span>
            <span className="text-cyan-400">.ai</span>
            <span className="hidden sm:inline-flex text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              v3.6
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Section Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-300">
          <a href="#how-it-works" className="hover:text-cyan-300 transition-colors">How It Works</a>
          <a href="#interactive-demo" className="hover:text-cyan-300 transition-colors">Simulators</a>
          <a href="#capabilities" className="hover:text-cyan-300 transition-colors">Capabilities</a>
          <a href="#architecture" className="hover:text-cyan-300 transition-colors">Architecture</a>
          <a href="#benchmarks" className="hover:text-cyan-300 transition-colors">Benchmarks</a>
          <a href="#api-integration" className="hover:text-cyan-300 transition-colors">API & CLI</a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                User: <span className="text-slate-200 font-bold">{user.name || user.email?.split('@')[0]}</span>
              </span>
              <Link 
                to="/dashboard" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 rounded-lg transition-all shadow-md shadow-indigo-600/25 active:scale-95 font-mono"
              >
                <span>Console</span>
                <ArrowRight size={13} />
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 p-2 hover:bg-slate-900 rounded-lg transition-colors border border-transparent hover:border-slate-800"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link 
                to="/login" 
                className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors font-mono"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 rounded-lg transition-all shadow-md shadow-indigo-600/25 active:scale-95 font-mono"
              >
                <span>Get Started</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

