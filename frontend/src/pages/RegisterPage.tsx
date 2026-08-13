import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Cpu, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  FolderGit, 
  Database, 
  ShieldCheck,
  Zap,
  Terminal
} from 'lucide-react';

interface RegisterPageProps {
  onRegisterSuccess: (user: any) => void;
  registerFn: (name: string, email: string) => Promise<any>;
}

export default function RegisterPage({ onRegisterSuccess, registerFn }: RegisterPageProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please provide your name and email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await registerFn(name.trim(), email.trim());
      onRegisterSuccess(data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try using a different email address.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill(sampleName: string, sampleEmail: string) {
    setName(sampleName);
    setEmail(sampleEmail);
    setPassword('developer123');
    setError('');
  }

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative selection:bg-indigo-500/30 selection:text-white font-sans antialiased overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-cyan-600/10 via-indigo-600/5 to-transparent blur-[120px] pointer-events-none rounded-full"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 blur-[120px] pointer-events-none rounded-full"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40"></div>

      <div className="max-w-4xl mx-auto w-full relative z-10 mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-300 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 group"
        >
          <ArrowLeft size={14} className="text-slate-400 group-hover:text-cyan-300 group-hover:-translate-x-0.5 transition-all" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: What you get */}
        <div className="lg:col-span-5 space-y-6 hidden lg:block pr-4">
          <Link to="/" className="inline-flex items-center gap-2.5 group focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 p-0.5 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
                <Cpu size={18} className="text-cyan-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-lg font-bold tracking-tight text-white">
              <span>CodeMind</span>
              <span className="text-cyan-400">.ai</span>
            </div>
          </Link>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
              Get started with your developer workspace.
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Index your repositories, explore database schemas in plain English, and run automated accuracy checks.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <FolderGit size={13} className="text-indigo-400" />
              </div>
              <div>
                <strong className="text-white block font-medium">Connect Any Git Repo</strong>
                <span className="text-slate-400 text-[11px]">Instant branch indexing with line-level code citations.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Database size={13} className="text-cyan-400" />
              </div>
              <div>
                <strong className="text-white block font-medium">Safe Plain English to SQL</strong>
                <span className="text-slate-400 text-[11px]">Automatic read-only rules protect your database.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={13} className="text-emerald-400" />
              </div>
              <div>
                <strong className="text-white block font-medium">Powered by Gemini 3.6 Flash</strong>
                <span className="text-slate-400 text-[11px]">Fast, grounded answers with zero hallucinations.</span>
              </div>
            </div>
          </div>

          {/* Quick presets helper */}
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2 backdrop-blur-xs">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
              Quick Fill Sample Profiles:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('Sarah Chen', 'sarah.chen@techcorp.io')}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              >
                Sarah (Tech Lead)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('Marcus Brody', 'marcus.brody@devlabs.com')}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              >
                Marcus (Backend)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Register Form Card */}
        <div className="lg:col-span-7">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            
            {/* Top Bar / Mobile Brand */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
              <div>
                <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-2 group">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 p-0.5 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full bg-[#0B0F19] rounded-[6px] flex items-center justify-center">
                      <Cpu size={14} className="text-cyan-400" />
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">CodeMind<span className="text-cyan-400">.ai</span></span>
                </Link>
                <h1 className="text-xl sm:text-2xl font-bold text-white font-sans tracking-tight">
                  Create Your Account
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Start searching code and databases with Gemini 3.6 Flash.
                </p>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                <Sparkles size={11} className="text-indigo-400" /> Free Workspace
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs leading-relaxed animate-in fade-in duration-200">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-slate-300 mb-1.5 font-sans">
                  Full Name / Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <User size={15} />
                  </span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5 font-sans">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <Mail size={15} />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-medium text-slate-300 font-sans">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Any password in demo mode
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <Lock size={15} />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Terms hint */}
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 leading-relaxed font-sans">
                By creating an account, you get instant access to codebase search, safe database querying, and automated quality testing.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 font-mono font-semibold text-xs sm:text-sm text-white bg-cyan-600 hover:bg-cyan-500 px-5 py-3 rounded-xl transition-all shadow-lg shadow-cyan-600/30 active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Creating profile...</span>
                  </>
                ) : (
                  <>
                    <span>Create Workspace Account</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Redirect */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
              <span>Already have an account? </span>
              <Link 
                to="/login" 
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors inline-flex items-center gap-1 ml-1"
              >
                <span>Sign in here</span>
                <ArrowRight size={12} />
              </Link>
            </div>

          </div>

          {/* Micro Footer */}
          <div className="mt-4 text-center text-[11px] font-mono text-slate-500 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400" /> Private & Secure
            </span>
            <span>•</span>
            <span>Gemini 3.6 Flash Engine</span>
          </div>

        </div>

      </div>
    </div>
  );
}
