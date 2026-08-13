import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Cpu, 
  Mail, 
  Lock, 
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

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  loginFn: (email: string) => Promise<any>;
}

export default function LoginPage({ onLoginSuccess, loginFn }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await loginFn(email);
      onLoginSuccess(data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  function handleDemoLogin(demoEmail = 'demo.developer@codemind.ai') {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setLoading(true);

    setTimeout(async () => {
      try {
        const data = await loginFn(demoEmail);
        onLoginSuccess(data.user);
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Demo login failed.');
      } finally {
        setLoading(false);
      }
    }, 450);
  }

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative selection:bg-indigo-500/30 selection:text-white font-sans antialiased overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-indigo-600/10 via-cyan-600/5 to-transparent blur-[120px] pointer-events-none rounded-full"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 blur-[120px] pointer-events-none rounded-full"></div>
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
        
        {/* Left Column: Value Proposition & Highlights */}
        <div className="lg:col-span-5 space-y-6 hidden lg:block pr-4">
          <Link to="/" className="inline-flex items-center gap-2.5 group focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-purple-600 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
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
              Instant AI answers from your codebase & database.
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your repositories and database schemas to ask questions in plain English with exact file and line references.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <FolderGit size={13} className="text-indigo-400" />
              </div>
              <div>
                <strong className="text-white block font-medium">Smart Repository Search</strong>
                <span className="text-slate-400 text-[11px]">Instant answers with exact line numbers and citations.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Database size={13} className="text-cyan-400" />
              </div>
              <div>
                <strong className="text-white block font-medium">Safe Plain English to SQL</strong>
                <span className="text-slate-400 text-[11px]">Read-only queries to keep your database protected.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={13} className="text-emerald-400" />
              </div>
              <div>
                <strong className="text-white block font-medium">Powered by Gemini 3.6 Flash</strong>
                <span className="text-slate-400 text-[11px]">High accuracy and speed on every query.</span>
              </div>
            </div>
          </div>

          {/* Testimonial / Trust Badge */}
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1.5 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold">
              <CheckCircle2 size={13} /> Ready for instant use
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              No complex setup required. Log in with a single click or try the pre-loaded developer demo account.
            </p>
          </div>
        </div>

        {/* Right Column: Sign In Form Card */}
        <div className="lg:col-span-7">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            
            {/* Top Bar / Mobile Brand */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
              <div>
                <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-2 group">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full bg-[#0B0F19] rounded-[6px] flex items-center justify-center">
                      <Cpu size={14} className="text-cyan-400" />
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">CodeMind<span className="text-cyan-400">.ai</span></span>
                </Link>
                <h1 className="text-xl sm:text-2xl font-bold text-white font-sans tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Sign in to your CodeMind workspace to continue.
                </p>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                <Sparkles size={11} className="text-cyan-400" /> Gemini 3.6 Flash
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs leading-relaxed animate-in fade-in duration-200">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Demo Login Pill Button */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => handleDemoLogin()}
                disabled={loading}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-indigo-500/40 hover:border-indigo-500/70 text-slate-200 transition-all flex items-center justify-between text-xs font-mono group hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-cyan-300">
                    <Zap size={13} />
                  </div>
                  <div className="text-left">
                    <span className="text-white font-bold block text-xs">One-Click Demo Account</span>
                    <span className="text-[10px] text-slate-400">demo.developer@codemind.ai</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-indigo-400 group-hover:text-cyan-300 transition-colors text-[11px] font-bold">
                  <span>Sign In</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-3 bg-[#0B0F19] text-slate-500 uppercase tracking-widest font-mono">
                  Or use your email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
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
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 font-mono font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Console</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Redirect */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
              <span>Don't have an account yet? </span>
              <Link 
                to="/register" 
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors inline-flex items-center gap-1 ml-1"
              >
                <span>Create one for free</span>
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
