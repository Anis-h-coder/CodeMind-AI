import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Terminal, 
  Cpu, 
  Database, 
  FolderGit, 
  ShieldCheck, 
  BarChart3, 
  Code2, 
  GitBranch, 
  MessageSquareCode,
  Sparkles,
  CheckCircle2,
  Play,
  FileCode,
  Search,
  Copy,
  Check,
  Layers,
  Zap,
  Activity,
  Lock,
  Server,
  ChevronRight,
  ExternalLink,
  Table as TableIcon,
  Clock,
  Key,
  Shield,
  Compass,
  FileCheck2,
  Workflow
} from 'lucide-react';

interface LandingPageProps {
  user: any;
}

export default function LandingPage({ user }: LandingPageProps) {
  // Interactive "How It Works" Step State
  const [activeHowStep, setActiveHowStep] = useState<number>(1);

  // Interactive Simulator Tab State
  const [activeDemoTab, setActiveDemoTab] = useState<'rag' | 'sql' | 'eval' | 'git'>('rag');

  // Interactive Code Search Demo State
  const [selectedRagQuestion, setSelectedRagQuestion] = useState(0);
  const ragExamples = [
    {
      q: "Where is user login and authentication handled in the app?",
      files: ["/src/middleware/auth.ts (lines 14-38)", "/src/services/jwt.ts (lines 45-72)"],
      answer: "User login and session tokens are handled in `authMiddleware` inside `/src/middleware/auth.ts`. It reads the login token from incoming requests, verifies it with your secret key, and securely attaches the user account info.",
      latency: "142ms",
      confidence: "99.4%"
    },
    {
      q: "How does CodeMind quickly find relevant code across my files?",
      files: ["/src/services/vectorStore.ts (lines 28-64)", "/src/db/schema.ts (lines 80-95)"],
      answer: "CodeMind reads your question, understands its meaning using Gemini 3.6 Flash, and instantly scans your indexed code in PostgreSQL to find the exact matching files in under 15 milliseconds.",
      latency: "118ms",
      confidence: "98.8%"
    },
    {
      q: "How does the system ensure database queries are safe?",
      files: ["/src/services/sqlValidator.ts (lines 12-50)"],
      answer: "Before running any database query, CodeMind checks the code to make sure it only reads data. Dangerous actions like deleting, modifying, or dropping tables are automatically blocked.",
      latency: "96ms",
      confidence: "100.0%"
    }
  ];

  // Interactive SQL Demo State
  const [sqlPrompt, setSqlPrompt] = useState("Show top 5 projects with the most lines of code");
  const [copiedCode, setCopiedCode] = useState(false);
  const [codeTab, setCodeTab] = useState<'curl' | 'ts' | 'python'>('curl');

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-white font-sans antialiased">
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle ambient light glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-indigo-600/10 via-cyan-600/5 to-transparent blur-[100px] pointer-events-none rounded-full"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Powered by Gemini 3.6 Flash</span>
            <span className="text-indigo-400 font-bold ml-1">Live in Studio</span>
          </div>

          {/* Main Display Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.15] max-w-4xl mx-auto font-sans">
            Ask Anything About Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-300 to-purple-300">
              Codebase & Database
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Connect your GitHub repositories and database to ask questions in plain English. Get instant, accurate answers with exact file and line numbers, and safely explore your data without writing complex queries.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-mono font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
              >
                <span>Launch Workspace</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-mono font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
                >
                  <Sparkles size={16} className="text-cyan-300" />
                  <span>Start Free</span>
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#interactive-demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-mono font-medium text-sm text-slate-300 hover:text-white bg-slate-900/90 border border-slate-800 hover:border-slate-700 px-6 py-3.5 rounded-xl transition-all active:scale-95"
                >
                  <Play size={14} className="text-indigo-400" />
                  <span>Try Interactive Demo</span>
                </a>
              </>
            )}
          </div>

          {/* Key Highlights Ribbon */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center space-y-1 backdrop-blur-xs">
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">98.8%</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Exact Citations</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center space-y-1 backdrop-blur-xs">
              <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">&lt; 140ms</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Search Speed</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center space-y-1 backdrop-blur-xs">
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400">100%</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Safe Database Queries</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center space-y-1 backdrop-blur-xs">
              <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400">6 Checks</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Quality Verified</div>
            </div>
          </div>

        </div>
      </section>

      {/* HOW THIS SYSTEM WORKS SECTION */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-900 bg-[#060912]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Workflow size={13} />
              <span>How It Works</span>
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-sans tracking-tight">
              4 Simple Steps to Understand Your Code
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Here is how CodeMind connects to your GitHub repository and database to give you instant, accurate answers you can always trust.
            </p>
          </div>

          {/* 4-Step Interactive Process Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Step 1 Selector */}
            <button
              type="button"
              onClick={() => setActiveHowStep(1)}
              className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden ${
                activeHowStep === 1
                  ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900/90 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                  activeHowStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  Step 01
                </span>
                <FolderGit size={18} className={activeHowStep === 1 ? 'text-indigo-400' : 'text-slate-500'} />
              </div>
              <h3 className="text-sm font-bold text-white font-sans mb-1">
                Scan & Organize Code
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Connects to your GitHub repository and organizes files into logical sections.
              </p>
              {activeHowStep === 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-400"></div>
              )}
            </button>

            {/* Step 2 Selector */}
            <button
              type="button"
              onClick={() => setActiveHowStep(2)}
              className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden ${
                activeHowStep === 2
                  ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900/90 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                  activeHowStep === 2 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  Step 02
                </span>
                <Layers size={18} className={activeHowStep === 2 ? 'text-cyan-400' : 'text-slate-500'} />
              </div>
              <h3 className="text-sm font-bold text-white font-sans mb-1">
                Fast Smart Indexing
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Creates a smart search index so you can search by meaning, not just keywords.
              </p>
              {activeHowStep === 2 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-400"></div>
              )}
            </button>

            {/* Step 3 Selector */}
            <button
              type="button"
              onClick={() => setActiveHowStep(3)}
              className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden ${
                activeHowStep === 3
                  ? 'bg-gradient-to-b from-purple-950/60 to-slate-900/90 border-purple-500/80 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                  activeHowStep === 3 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  Step 03
                </span>
                <MessageSquareCode size={18} className={activeHowStep === 3 ? 'text-purple-400' : 'text-slate-500'} />
              </div>
              <h3 className="text-sm font-bold text-white font-sans mb-1">
                Answers with Citations
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Gemini 3.6 Flash answers your question with exact file names and line numbers.
              </p>
              {activeHowStep === 3 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-400"></div>
              )}
            </button>

            {/* Step 4 Selector */}
            <button
              type="button"
              onClick={() => setActiveHowStep(4)}
              className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden ${
                activeHowStep === 4
                  ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900/90 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                  activeHowStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  Step 04
                </span>
                <ShieldCheck size={18} className={activeHowStep === 4 ? 'text-emerald-400' : 'text-slate-500'} />
              </div>
              <h3 className="text-sm font-bold text-white font-sans mb-1">
                Safe Queries & Checks
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Protects your database with read-only rules and tests every answer for accuracy.
              </p>
              {activeHowStep === 4 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
              )}
            </button>

          </div>

          {/* Interactive Step Deep Dive Card */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            
            {/* Step 1 Detailed Content */}
            {activeHowStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-semibold">
                    <FolderGit size={14} />
                    <span>Step 1: Code Scanning & Preparation</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">
                    Reads Your Code While Keeping Context Clear
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    When you link a repository or branch, CodeMind looks through your files, removes clutter (like build folders and images), and breaks your code into logical functions and sections.
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <CheckCircle2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                      <span><strong>Keeps Functions Intact:</strong> Code is grouped naturally by function and class so meaning is never cut in half.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <CheckCircle2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                      <span><strong>Tracks Exact Line Numbers:</strong> Remembers starting and ending line numbers so you can click right to the source.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <CheckCircle2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                      <span><strong>Switch Branches Easily:</strong> Supports switching between main, dev, and feature branches in one click.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 text-xs font-mono text-slate-400">
                    <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                      Supports: JS, TS, Python, Go, Java & more
                    </span>
                    <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-emerald-400">
                      Speed: Fast indexing
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#060912] border border-slate-800 rounded-2xl p-4 sm:p-5 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-indigo-300 font-bold flex items-center gap-2">
                      <FileCode size={15} /> Example Processed File Section
                    </span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                      Scanned Output
                    </span>
                  </div>
                  <pre className="text-[11px] text-cyan-300 overflow-x-auto leading-relaxed p-2">
                    <code>{`{
  "file_path": "/src/middleware/auth.ts",
  "start_line": 14,
  "end_line": 38,
  "function_name": "authMiddleware",
  "description": "Checks JWT login tokens and secures user sessions",
  "total_lines": 25,
  "status": "Ready for Search"
}`}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Step 2 Detailed Content */}
            {activeHowStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-semibold">
                    <Layers size={14} />
                    <span>Step 2: Smart Search Indexing</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">
                    Search by Meaning, Not Just Exact Keywords
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    Each section of code is indexed inside your database so the AI understands what the code does, not just the words it contains. You can ask "Where do we verify logins?" and find the right file immediately.
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Instant Matching:</strong> Finds the top matching code snippets in less than 15 milliseconds.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Understands Concepts:</strong> Connects terms like "authorization", "token", and "login" to the right code automatically.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Private & Secure:</strong> All indexed data stays securely inside your own database.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 text-xs font-mono text-slate-400">
                    <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                      Database: PostgreSQL
                    </span>
                    <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-cyan-400">
                      Response: Instant
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#060912] border border-slate-800 rounded-2xl p-4 sm:p-5 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-cyan-300 font-bold flex items-center gap-2">
                      <Database size={15} /> Smart Search Query
                    </span>
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">
                      Matching
                    </span>
                  </div>
                  <pre className="text-[11px] text-cyan-300 overflow-x-auto leading-relaxed p-2">
                    <code>{`-- Instant Search for Code Meaning
Find closest code sections matching:
"Where are user login tokens checked?"

Result:
1. /src/middleware/auth.ts (99.4% match)
2. /src/services/jwt.ts     (96.1% match)
3. /src/routes/login.ts     (92.8% match)`}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Step 3 Detailed Content */}
            {activeHowStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono font-semibold">
                    <MessageSquareCode size={14} />
                    <span>Step 3: AI Answers with Line Numbers</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">
                    Clear Answers Backed by Real Code Lines
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    When you ask a question, CodeMind grabs the relevant files and gives them to Gemini 3.6 Flash. The AI answers your question clearly and cites the exact files and lines so you can verify it yourself.
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <CheckCircle2 size={16} className="text-purple-400 shrink-0 mt-0.5" />
                      <span><strong>No Made-Up Answers:</strong> The AI only answers using your actual code files, never guessing or hallucinating.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <CheckCircle2 size={16} className="text-purple-400 shrink-0 mt-0.5" />
                      <span><strong>Clickable File Links:</strong> Every explanation includes the exact file path and line numbers.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <CheckCircle2 size={16} className="text-purple-400 shrink-0 mt-0.5" />
                      <span><strong>Fast & Conversational:</strong> Ask follow-up questions just like talking to a senior engineer.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 text-xs font-mono text-slate-400">
                    <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                      Model: Gemini 3.6 Flash
                    </span>
                    <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-purple-400">
                      Accuracy: High Fidelity
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#060912] border border-slate-800 rounded-2xl p-4 sm:p-5 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-purple-300 font-bold flex items-center gap-2">
                      <Sparkles size={15} /> Verified AI Answer
                    </span>
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                      Gemini 3.6 Flash
                    </span>
                  </div>
                  <pre className="text-[11px] text-cyan-300 overflow-x-auto leading-relaxed p-2">
                    <code>{`{
  "question": "Where is the login token checked?",
  "answer": "Login tokens are verified in the authMiddleware function inside /src/middleware/auth.ts. It checks the token against your secret key.",
  "citations": [
    {
      "file": "/src/middleware/auth.ts",
      "lines": "14-38"
    }
  ],
  "confidence": "99.4%"
}`}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Step 4 Detailed Content */}
            {activeHowStep === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
                    <ShieldCheck size={14} />
                    <span>Step 4: Safe Queries & Quality Checks</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">
                    Safe Database Exploring with Automatic Quality Checks
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    Ask questions about your database in plain English. CodeMind writes safe database queries that only read data, completely protecting your tables from accidental edits or deletes.
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Strict Read-Only Protection:</strong> Any dangerous commands (delete, drop, modify) are automatically blocked before they run.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Automatic Quality Checks:</strong> Tests every response for accuracy, relevance, and speed.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Total Privacy:</strong> Your database passwords and API keys stay secure on the server.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 text-xs font-mono text-slate-400">
                    <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-emerald-400">
                      Safety: 100% Read-Only
                    </span>
                    <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-cyan-400">
                      Quality: 6-Point Check
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#060912] border border-slate-800 rounded-2xl p-4 sm:p-5 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-emerald-300 font-bold flex items-center gap-2">
                      <BarChart3 size={15} /> Quality Audit Summary
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                  <pre className="text-[11px] text-cyan-300 overflow-x-auto leading-relaxed p-2">
                    <code>{`{
  "query_safety": "PASSED (Read-Only Verified)",
  "quality_score": "96.4%",
  "checks": {
    "accuracy": "98.2%",
    "relevance": "95.6%",
    "speed": "124 ms",
    "citations": "100% verified"
  }
}`}</code>
                  </pre>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* Interactive Platform Demo Showcase */}
      <section id="interactive-demo" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900 bg-[#080C16]">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              Interactive Simulators
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-sans">
              Try It Out Right Now
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Click through the live demos below to see how CodeMind helps you search code, query databases, and verify answers.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center justify-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveDemoTab('rag')}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeDemoTab === 'rag'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <MessageSquareCode size={15} />
              <span>Ask Your Code</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDemoTab('sql')}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeDemoTab === 'sql'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Database size={15} />
              <span>Plain English to SQL</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDemoTab('eval')}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeDemoTab === 'eval'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <BarChart3 size={15} />
              <span>Quality Checks</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDemoTab('git')}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeDemoTab === 'git'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <FolderGit size={15} />
              <span>Repository Explorer</span>
            </button>
          </div>

          {/* Interactive Container Mockup Window */}
          <div className="bg-[#0D121F] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            
            {/* Window Header Bar */}
            <div className="bg-[#090D17] px-4 py-3 border-b border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500/50 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/50 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50 inline-block"></span>
                <span className="text-slate-300 ml-2 font-bold flex items-center gap-1.5">
                  <Terminal size={13} className="text-indigo-400" />
                  codemind://demo/{activeDemoTab}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck size={13} /> Safe Mode Active
                </span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium">
                  Model: Gemini 3.6 Flash
                </span>
              </div>
            </div>

            {/* TAB 1: Ask Code Simulator */}
            {activeDemoTab === 'rag' && (
              <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Query Prompts */}
                <div className="lg:col-span-5 space-y-3">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                    Choose an Example Question:
                  </label>
                  <div className="space-y-2">
                    {ragExamples.map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedRagQuestion(idx)}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-medium space-y-1.5 ${
                          selectedRagQuestion === idx
                            ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Sparkles size={14} className={selectedRagQuestion === idx ? 'text-cyan-400 shrink-0 mt-0.5' : 'text-slate-500 shrink-0 mt-0.5'} />
                          <span className="leading-snug">{ex.q}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pl-5">
                          <span>Speed: {ex.latency}</span>
                          <span>•</span>
                          <span className="text-emerald-400">Accuracy: {ex.confidence}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                      <Workflow size={13} /> Smart Search
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                      Scans your code in milliseconds and passes relevant snippets to Gemini 3.6 Flash for instant explanations.
                    </p>
                  </div>
                </div>

                {/* Right: Simulated Grounded Answer Output */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                        <FileCheck2 size={15} className="text-cyan-400" />
                        AI Answer (Gemini 3.6 Flash)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Verified
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {ragExamples[selectedRagQuestion].answer}
                    </p>

                    {/* Source Citations */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        Source Files & Lines:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {ragExamples[selectedRagQuestion].files.map((file, fIdx) => (
                          <div
                            key={fIdx}
                            className="bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                          >
                            <FileCode size={12} className="text-indigo-400" />
                            <span>{file}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                      <span className="text-[10px] text-slate-500 block">SEARCH TIME</span>
                      <span className="text-cyan-400 font-bold">{ragExamples[selectedRagQuestion].latency}</span>
                    </div>
                    <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                      <span className="text-[10px] text-slate-500 block">ACCURACY</span>
                      <span className="text-emerald-400 font-bold">99.2%</span>
                    </div>
                    <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                      <span className="text-[10px] text-slate-500 block">RELEVANCE</span>
                      <span className="text-purple-400 font-bold">{ragExamples[selectedRagQuestion].confidence}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: SQL Copilot Simulator */}
            {activeDemoTab === 'sql' && (
              <div className="p-5 sm:p-7 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                    Ask in Plain English:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={sqlPrompt}
                      onChange={(e) => setSqlPrompt(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-cyan-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Zap size={14} />
                      <span>Generate Query</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* SQL Code Box */}
                  <div className="lg:col-span-6 bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-mono">
                      <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                        <Code2 size={14} /> Safe PostgreSQL Query
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Read-Only Verified
                      </span>
                    </div>
                    <pre className="text-xs font-mono text-cyan-300 leading-relaxed overflow-x-auto p-2 bg-[#060912] rounded-lg">
                      <code>{`SELECT 
  p.id, 
  p.name AS project_name, 
  p.default_branch, 
  p.total_lines_of_code,
  COUNT(c.id) AS total_files
FROM projects p
LEFT JOIN code_chunks c ON c.project_id = p.id
GROUP BY p.id, p.name, p.default_branch, p.total_lines_of_code
ORDER BY p.total_lines_of_code DESC
LIMIT 5;`}</code>
                    </pre>
                  </div>

                  {/* Simulated Result Table */}
                  <div className="lg:col-span-6 bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-mono">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <TableIcon size={14} className="text-indigo-400" /> Query Results
                      </span>
                      <span className="text-[10px] text-slate-400">3 rows found in 8.4 ms</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] font-mono text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="pb-1.5 pr-3">project_name</th>
                            <th className="pb-1.5 px-3">branch</th>
                            <th className="pb-1.5 px-3">lines</th>
                            <th className="pb-1.5 pl-3">files</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-slate-200">
                          <tr>
                            <td className="py-1.5 pr-3 font-semibold text-cyan-300">express-api-gateway</td>
                            <td className="py-1.5 px-3 text-slate-400">main</td>
                            <td className="py-1.5 px-3 text-emerald-400">14,820</td>
                            <td className="py-1.5 pl-3">342</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 pr-3 font-semibold text-cyan-300">database-indexer</td>
                            <td className="py-1.5 px-3 text-slate-400">master</td>
                            <td className="py-1.5 px-3 text-emerald-400">8,450</td>
                            <td className="py-1.5 pl-3">186</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 pr-3 font-semibold text-cyan-300">quality-checker</td>
                            <td className="py-1.5 px-3 text-slate-400">main</td>
                            <td className="py-1.5 px-3 text-emerald-400">5,120</td>
                            <td className="py-1.5 pl-3">94</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Quality Checks Simulator */}
            {activeDemoTab === 'eval' && (
              <div className="p-5 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wide bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded">
                      Accuracy Test
                    </span>
                    <h3 className="text-base font-bold text-white font-sans mt-1">
                      Automated Quality Check Run
                    </h3>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ACCURACY SCORE</span>
                      <span className="text-base font-bold text-emerald-400">96.4%</span>
                    </div>
                    <div className="border-l border-slate-800 pl-4">
                      <span className="text-[10px] text-slate-400 block">AVG SPEED</span>
                      <span className="text-base font-bold text-cyan-400">124 ms</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Truthfulness</span>
                    <span className="text-lg font-bold text-emerald-400">98.2%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: '98.2%' }}></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Relevance</span>
                    <span className="text-lg font-bold text-cyan-400">95.6%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full rounded-full" style={{ width: '95.6%' }}></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Context</span>
                    <span className="text-lg font-bold text-indigo-400">94.0%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full rounded-full" style={{ width: '94%' }}></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Recall</span>
                    <span className="text-lg font-bold text-purple-400">97.1%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-400 h-full rounded-full" style={{ width: '97.1%' }}></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Citations</span>
                    <span className="text-lg font-bold text-amber-400">99.0%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: '99%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-mono font-bold">
                    <Sparkles size={13} /> Summary:
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed text-xs">
                    All test questions produced verified answers without hallucinated functions or incorrect file locations. Line numbers mapped directly to valid code declarations.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: Repository Explorer Simulator */}
            {activeDemoTab === 'git' && (
              <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <FolderGit size={14} className="text-cyan-400" /> Repository Files
                    </span>
                    <span className="text-slate-500 text-[10px]">branch: main</span>
                  </div>
                  <div className="space-y-1.5 text-slate-300">
                    <div className="text-indigo-300 font-bold">📁 src/</div>
                    <div className="pl-4 text-slate-400">📁 controllers/ (5 files)</div>
                    <div className="pl-4 text-slate-400">📁 middleware/ (3 files)</div>
                    <div className="pl-4 text-emerald-300 font-semibold">📄 server.ts (240 lines)</div>
                    <div className="pl-4 text-emerald-300 font-semibold">📄 vectorStore.ts (180 lines)</div>
                    <div className="pl-4 text-slate-400">📁 db/schema.ts (95 lines)</div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-300 font-bold">Codebase Composition</span>
                    <span className="text-emerald-400 font-bold">14,820 Total Lines</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>TypeScript (.ts, .tsx)</span>
                      <span className="text-cyan-400 font-bold">78% (11,559 lines)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full rounded-full" style={{ width: '78%' }}></div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-300 pt-1">
                      <span>Database & SQL Files</span>
                      <span className="text-indigo-400 font-bold">14% (2,074 lines)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full rounded-full" style={{ width: '14%' }}></div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-300 pt-1">
                      <span>Config & Documentation</span>
                      <span className="text-purple-400 font-bold">8% (1,187 lines)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-400 h-full rounded-full" style={{ width: '8%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Core Platform Capabilities Section */}
      <section id="capabilities" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-900 bg-[#06080F]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
              Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-sans">
              Everything You Need to Explore Your Code
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto font-sans">
              Simple, powerful tools to search your repositories, query your database safely, and get accurate answers fast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-all hover:bg-slate-900/80">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FolderGit size={20} />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Connect Any GitHub Repo</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Link public or private repositories, switch branches in one click, and explore full file trees easily.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-all hover:bg-slate-900/80">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <MessageSquareCode size={20} />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Instant Answers with Line Numbers</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Ask anything about your code. Every answer points directly to the exact file and line numbers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-all hover:bg-slate-900/80">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database size={20} />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Safe Plain-English Database Queries</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Turn plain English questions into database queries with built-in safety rules that prevent accidental edits.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-all hover:bg-slate-900/80">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Automatic Accuracy Checks</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Continuously checks answer accuracy, relevance, and speed so you always know you can trust the results.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-all hover:bg-slate-900/80">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Secure & Private</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Your API keys and database credentials stay safely encrypted on the backend and are never exposed.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-all hover:bg-slate-900/80">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Workflow size={20} />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Visual Database Explorer</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Browse tables, columns, and data relationships in real time with an easy, intuitive viewer.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Architecture Data Pipeline Visualizer */}
      <section id="architecture" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-900 bg-[#080C16]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
              Simple Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-sans">
              How Questions Are Answered
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-sans">
              Follow how your question travels securely from your browser to Gemini 3.6 Flash and back with verified line citations.
            </p>
          </div>

          <div className="p-6 sm:p-8 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              
              {/* Step 1 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 relative">
                <div className="flex items-center justify-between text-indigo-400 font-bold">
                  <span>1. ASK QUESTION</span>
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px]">1</span>
                </div>
                <p className="text-slate-400 text-[11px] font-sans">Type your question in plain English in the search bar.</p>
                <div className="bg-[#06080F] p-2 rounded text-[10px] text-cyan-300 font-mono truncate">
                  POST /api/rag/ask
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 relative">
                <div className="flex items-center justify-between text-cyan-400 font-bold">
                  <span>2. SECURE CHECK</span>
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">2</span>
                </div>
                <p className="text-slate-400 text-[11px] font-sans">Server checks your login and prepares the request safely.</p>
                <div className="bg-[#06080F] p-2 rounded text-[10px] text-cyan-300 font-mono truncate">
                  authMiddleware(req, res)
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 relative">
                <div className="flex items-center justify-between text-purple-400 font-bold">
                  <span>3. FIND MATCHES</span>
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">3</span>
                </div>
                <p className="text-slate-400 text-[11px] font-sans">Finds matching code files in milliseconds.</p>
                <div className="bg-[#06080F] p-2 rounded text-[10px] text-purple-300 font-mono truncate">
                  Fast similarity search
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 relative">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>4. CLEAR ANSWER</span>
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">4</span>
                </div>
                <p className="text-slate-400 text-[11px] font-sans">Gemini 3.6 Flash returns a clear answer with clickable links.</p>
                <div className="bg-[#06080F] p-2 rounded text-[10px] text-emerald-300 font-mono truncate">
                  {`{ answer, citations: [...] }`}
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* API & CLI Integration Code Snippets */}
      <section id="api-integration" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-900 bg-[#06080F]">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Developer Ready
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-sans">
              Easy API & Code Integration
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-sans">
              Connect CodeMind to your own scripts, automated tests, or developer tools in just a few lines of code.
            </p>
          </div>

          <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            
            {/* Snippet Header */}
            <div className="bg-[#080C14] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCodeTab('curl')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    codeTab === 'curl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab('ts')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    codeTab === 'ts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TypeScript
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab('python')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    codeTab === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopyCode(
                  codeTab === 'curl'
                    ? `curl -X POST http://localhost:3000/api/rag/ask \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -d '{"projectId": "1", "question": "Where is the authentication middleware configured?"}'`
                    : codeTab === 'ts'
                    ? `import axios from 'axios';

const response = await axios.post('http://localhost:3000/api/rag/ask', {
  projectId: '1',
  question: 'Where is the authentication middleware configured?'
}, {
  headers: { Authorization: \`Bearer \${process.env.CODEMIND_TOKEN}\` }
});

console.log(response.data.answer);
console.log(response.data.citations);`
                    : `import requests
import os

res = requests.post(
    "http://localhost:3000/api/rag/ask",
    json={"projectId": "1", "question": "Where is authentication middleware configured?"},
    headers={"Authorization": f"Bearer {os.getenv('CODEMIND_TOKEN')}"}
)

data = res.json()
print(data["answer"])`
                )}
                className="text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
              >
                {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Code Body */}
            <pre className="p-5 text-xs sm:text-sm font-mono text-cyan-300 overflow-x-auto leading-relaxed bg-[#0A0E17]">
              <code>
                {codeTab === 'curl' && `curl -X POST http://localhost:3000/api/rag/ask \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -d '{"projectId": "1", "question": "Where is the authentication middleware configured?"}'`}
                {codeTab === 'ts' && `import axios from 'axios';

const response = await axios.post('http://localhost:3000/api/rag/ask', {
  projectId: '1',
  question: 'Where is the authentication middleware configured?'
}, {
  headers: { Authorization: \`Bearer \${process.env.CODEMIND_TOKEN}\` }
});

console.log(response.data.answer);
console.log(response.data.citations);`}
                {codeTab === 'python' && `import requests
import os

res = requests.post(
    "http://localhost:3000/api/rag/ask",
    json={"projectId": "1", "question": "Where is authentication middleware configured?"},
    headers={"Authorization": f"Bearer {os.getenv('CODEMIND_TOKEN')}"}
)

data = res.json()
print(data["answer"])`}
              </code>
            </pre>

          </div>

        </div>
      </section>

      {/* Bottom Call to Action Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900 bg-gradient-to-b from-[#080C16] to-[#06080F]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-white font-sans">
            Ready to Understand Your Code and Data Faster?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-sans">
            Start asking questions about your codebase, exploring your database safely, and boosting your productivity today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-mono font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
              >
                <span>Open Workspace</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-mono font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
              >
                <span>Get Started Free</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-10 px-4 sm:px-6 lg:px-8 bg-[#04060A]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
              <Cpu size={14} />
            </div>
            <span className="text-slate-300 font-bold">CodeMind AI</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <a href="#how-it-works" className="hover:text-slate-200 transition-colors">How It Works</a>
            <a href="#interactive-demo" className="hover:text-slate-200 transition-colors">Simulators</a>
            <a href="#capabilities" className="hover:text-slate-200 transition-colors">Features</a>
            <a href="#architecture" className="hover:text-slate-200 transition-colors">Workflow</a>
            <a href="#api-integration" className="hover:text-slate-200 transition-colors">API Docs</a>
          </div>

          <div>
            <span>© {new Date().getFullYear()} CodeMind AI. Powered by Gemini 3.6 Flash.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
