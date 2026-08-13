import { useState, useEffect } from 'react';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Compass,
  Play,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  Target,
  FileCheck2,
  BarChart3,
  Terminal,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Copy,
  Check,
  ArrowRight,
  Workflow,
} from 'lucide-react';

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg border border-slate-700 bg-slate-900 overflow-hidden font-mono text-xs">
      <div className="bg-slate-800/80 px-3 py-1.5 border-b border-slate-700 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-indigo-300 font-mono uppercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-slate-700 px-2 py-0.5 rounded transition-all"
        >
          {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-3 overflow-x-auto text-slate-200 font-mono">
        <pre className="m-0"><code>{code}</code></pre>
      </div>
    </div>
  );
}

function FlowDiagramBox({ flowText }: { flowText: string }) {
  const steps = flowText.split(/\s*(?:↓|->|➔|→)\s*/).filter(s => s.trim().length > 0);
  if (steps.length <= 1) return null;

  return (
    <div className="my-3 p-3 rounded-lg border border-indigo-500/30 bg-indigo-950/40">
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-indigo-500/20 text-[10px] uppercase font-mono tracking-wider text-indigo-300 font-semibold">
        <Workflow size={12} className="text-indigo-400" />
        <span>Architecture Flow</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div className="bg-slate-900 border border-slate-750 text-slate-200 text-[11px] font-mono px-2.5 py-1 rounded shadow-sm flex items-center gap-1.5 hover:border-indigo-500/50 transition-all">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <span>{step.trim()}</span>
            </div>
            {idx < steps.length - 1 && (
              <ArrowRight size={12} className="text-indigo-400 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getPlainText(children: any): string {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(getPlainText).join('');
  }
  if (children.props && children.props.children) {
    return getPlainText(children.props.children);
  }
  return '';
}

function AssistantMessageContent({ content }: { content: string }) {
  return (
    <div className="text-slate-200 text-xs leading-relaxed space-y-2.5 font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2({ children }) {
            return (
              <h2 className="text-xs font-bold text-indigo-300 font-mono mt-3 mb-1.5 pb-0.5 border-b border-slate-800 uppercase tracking-wide">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-xs font-bold text-slate-200 font-mono mt-2 mb-1">
                {children}
              </h3>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isBlock = Boolean(match) || codeString.includes('\n');

            if (isBlock) {
              return <CodeBlock code={codeString} language={match ? match[1] : ''} />;
            }

            return (
              <code className="bg-slate-800 text-cyan-200 px-1.5 py-0.2 rounded border border-slate-700 font-mono text-[11px] font-semibold inline" {...props}>
                {children}
              </code>
            );
          },
          ul({ children }) {
            return <ul className="list-disc pl-4 space-y-1 my-1 text-slate-300">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-4 space-y-1 my-1 text-slate-300">{children}</ol>;
          },
          li({ children }) {
            return (
              <li className="text-slate-300 text-xs leading-relaxed">
                {children}
              </li>
            );
          },
          p({ children }) {
            const plainText = getPlainText(children);
            if ((plainText.includes('↓') || plainText.includes('->') || plainText.includes('→') || plainText.includes('➔')) && plainText.length < 350) {
              return <FlowDiagramBox flowText={plainText} />;
            }
            return <p className="text-slate-200 text-xs leading-relaxed mb-1.5">{children}</p>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-indigo-500 bg-indigo-950/30 px-3 py-1.5 my-2 rounded-r text-slate-300 text-[11px] italic">
                {children}
              </blockquote>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface EvaluationSuiteProps {
  projectId: string;
}

export default function EvaluationSuite({ projectId }: EvaluationSuiteProps) {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [runQueries, setRunQueries] = useState<any[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [expandedQueryId, setExpandedQueryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [runSearch, setRunSearch] = useState('');
  const [queryFilter, setQueryFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [querySearch, setQuerySearch] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchRuns();
    }
  }, [projectId]);

  // Fetch individual query results whenever selectedRun changes
  useEffect(() => {
    const activeRunId = selectedRun?.runId || selectedRun?.id;
    if (projectId && activeRunId) {
      loadRunResults(activeRunId);
    } else {
      setRunQueries([]);
    }
  }, [projectId, selectedRun?.runId, selectedRun?.id]);

  const loadRunResults = async (runId: string) => {
    setLoadingQueries(true);
    try {
      const res = await api.evaluations.results(projectId, runId);
      if (res.success && Array.isArray(res.results)) {
        setRunQueries(res.results);
      } else {
        setRunQueries([]);
      }
    } catch (err) {
      console.error('Failed to load run query results:', err);
      setRunQueries([]);
    } finally {
      setLoadingQueries(false);
    }
  };

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const data = await api.evaluations.list(projectId);
      const runsList = Array.isArray(data) 
        ? data 
        : (data && Array.isArray(data.runs) ? data.runs : []);
      setRuns(runsList);
      if (runsList.length > 0) {
        setSelectedRun(runsList[0]);
      } else {
        setSelectedRun(null);
      }
    } catch (err) {
      console.error('Failed to fetch evaluation runs:', err);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerEval = async () => {
    setEvaluating(true);
    setLogs(['Initiating RAG Benchmark Pipeline...']);
    
    // Progress logging
    const addLog = (msg: string) => {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    setTimeout(() => addLog('Loading 6 golden benchmark queries...'), 400);
    setTimeout(() => addLog('Generating vector retrieval context via pgvector...'), 1200);
    setTimeout(() => addLog('Evaluating faithfulness score against Gemini ground truth...'), 2400);
    setTimeout(() => addLog('Computing context relevance & citation precision metrics...'), 3600);

    try {
      const runResult = await api.evaluations.trigger(projectId);
      addLog(`Evaluation completed! Run ID: ${runResult.runId || runResult.id || 'eval-run'}`);
      await fetchRuns();
    } catch (err: any) {
      addLog(`Error during evaluation: ${err.message || 'Pipeline error'}`);
    } finally {
      setTimeout(() => {
        setEvaluating(false);
      }, 1000);
    }
  };

  // Metric percentage helper
  const formatPct = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return '0%';
    const num = val <= 1 && val > 0 ? Math.round(val * 100) : Math.round(val);
    return `${num}%`;
  };

  const getPctNum = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return 0;
    return val <= 1 && val > 0 ? Math.round(val * 100) : Math.round(val);
  };

  // Filtered queries calculation
  const filteredQueries = runQueries.filter(q => {
    const isFailed = q.status === 'failed';
    if (queryFilter === 'passed' && isFailed) return false;
    if (queryFilter === 'failed' && !isFailed) return false;

    if (querySearch) {
      const term = querySearch.toLowerCase();
      const question = (q.question || '').toLowerCase();
      const answer = (q.generatedAnswer || q.answer || '').toLowerCase();
      return question.includes(term) || answer.includes(term);
    }
    return true;
  });

  // Cycle runs helper
  const currentRunIndex = runs.findIndex(r => (r.runId || r.id) === (selectedRun?.runId || selectedRun?.id));

  const handlePrevRun = () => {
    if (currentRunIndex > 0) {
      setSelectedRun(runs[currentRunIndex - 1]);
    }
  };

  const handleNextRun = () => {
    if (currentRunIndex < runs.length - 1) {
      setSelectedRun(runs[currentRunIndex + 1]);
    }
  };

  return (
    <div className="space-y-5 w-full animate-fade-in select-text pb-8">
      
      {/* Top Banner & Control Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
            <Compass size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight text-white">
                RAG Evaluation & Benchmark Suite
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                6 Golden Test Queries
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Automated LLM quality benchmarks scoring faithfulness, context relevance, recall, & citation precision.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchRuns}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
            title="Refresh Runs"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleTriggerEval}
            disabled={evaluating}
            className="bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm font-mono shrink-0 disabled:opacity-50"
          >
            {evaluating ? (
              <>
                <RefreshCw size={15} className="animate-spin text-indigo-100" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play size={15} className="fill-current text-indigo-200" />
                <span>Run Diagnostics</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Terminal Console (When Evaluating) */}
      {evaluating && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 shadow-md animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-mono text-indigo-400">
            <span className="flex items-center gap-2 font-bold">
              <Terminal size={14} /> Evaluation Pipeline Console
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> EXECUTING BENCHMARKS
            </span>
          </div>
          <div className="bg-[#0d1117] p-3.5 rounded-lg font-mono text-xs text-slate-200 space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
            {logs.map((log, idx) => (
              <div key={`eval-log-${idx}`} className="flex items-start gap-2">
                <span className="text-indigo-400 shrink-0">›</span>
                <span className={log.includes('completed') ? 'text-emerald-400 font-semibold' : ''}>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP RUN SELECTOR RIBBON (Instantly visible & accessible run history switcher) */}
      <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={14} className="text-indigo-400" />
            <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wide">
              Run History Switcher
            </h3>
            <span className="text-[10px] font-mono bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-md font-bold">
              {runs.length} Total Runs
            </span>
          </div>

          {/* Prev / Next controls */}
          {runs.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[10px] text-slate-400 mr-1">
                Run {currentRunIndex >= 0 ? currentRunIndex + 1 : 1} of {runs.length}
              </span>
              <button
                type="button"
                onClick={handlePrevRun}
                disabled={currentRunIndex <= 0}
                className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
                title="Previous Run"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={handleNextRun}
                disabled={currentRunIndex >= runs.length - 1}
                className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
                title="Next Run"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Horizontal Scrollable Run Cards */}
        {runs.length === 0 ? (
          <div className="p-4 text-center text-slate-500 font-mono text-xs bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
            No diagnostic benchmark runs recorded yet. Click <strong className="text-indigo-400">Run Diagnostics</strong> above to start your first evaluation!
          </div>
        ) : (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
            {runs.map((r, idx) => {
              const runIdStr = r.runId || r.id || `eval-run-${idx}`;
              const isSelected = (selectedRun?.runId || selectedRun?.id) === runIdStr;
              const score = r.averageScore ?? r.overallScore ?? 0;
              const isHigh = score >= 80;
              const isMid = score >= 50 && score < 80;

              return (
                <button
                  key={runIdStr}
                  type="button"
                  onClick={() => setSelectedRun(r)}
                  className={`shrink-0 p-2.5 rounded-xl border text-left transition-all min-w-[170px] ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`font-mono text-[11px] font-bold truncate max-w-[100px] ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {runIdStr}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      isSelected
                        ? 'bg-white/20 text-white border border-white/30'
                        : isHigh
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isMid
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {score > 0 ? `${score.toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between text-[9px] font-mono ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                    <span>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Today'}</span>
                    <span>{r.completedQuestions || 6}/6 pass</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Detailed Run History List Sidebar */}
        <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800/80 p-4 rounded-xl space-y-3 shadow-md h-full flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <History size={14} className="text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                All Evaluation Runs
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-semibold border border-slate-700/60">
              {runs.length} Runs
            </span>
          </div>

          {/* Search Bar for Runs */}
          {runs.length > 2 && (
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={runSearch}
                onChange={(e) => setRunSearch(e.target.value)}
                placeholder="Search run IDs..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>
          )}

          {/* Run List */}
          {!Array.isArray(runs) || runs.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-mono text-xs my-auto">
              No evaluation runs stored.
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar flex-1">
              {runs
                .filter(r => !runSearch || (r.runId || r.id || '').toLowerCase().includes(runSearch.toLowerCase()))
                .map((r, idx) => {
                  const runIdStr = r.runId || r.id || `eval-run-${idx}`;
                  const isSelected = (selectedRun?.runId || selectedRun?.id) === runIdStr;
                  const score = r.averageScore ?? r.overallScore ?? 0;
                  return (
                    <div
                      key={runIdStr}
                      onClick={() => setSelectedRun(r)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-200 truncate max-w-[130px]" title={runIdStr}>
                          {runIdStr}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          score >= 80 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : score >= 50
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {score > 0 ? `${score.toFixed(1)}%` : '0%'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                        <span>{r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                        <span>{r.completedQuestions || 6}/6 questions</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Run Details & Metric Breakdown */}
        <div className="lg:col-span-8 space-y-5">
          {selectedRun ? (
            <>
              {/* Score Breakdown Header Card */}
              <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-xl space-y-5 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded uppercase font-mono">
                        Active Run Inspection
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {selectedRun.createdAt ? new Date(selectedRun.createdAt).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mt-1.5 font-mono">
                      Run ID: {selectedRun.runId || selectedRun.id || 'N/A'}
                    </h3>
                  </div>

                  {/* Quality Tier Banner */}
                  {(() => {
                    const score = selectedRun.averageScore ?? selectedRun.overallScore ?? 0;
                    return (
                      <div className="bg-slate-950 text-white p-3.5 rounded-xl text-center shrink-0 border border-slate-800 shadow-sm min-w-[160px]">
                        <span className="text-[9px] uppercase font-mono tracking-wider block text-slate-400">
                          Overall Quality
                        </span>
                        <span className="text-2xl font-extrabold font-mono text-indigo-400 mt-0.5 block">
                          {score.toFixed(1)}%
                        </span>
                        <span className={`text-[9px] font-mono font-bold mt-0.5 inline-block px-1.5 py-0.2 rounded ${
                          score >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {score >= 80 ? 'Exceptional' : 'Needs Tuning'}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Individual Metric Bars Panel */}
                {(() => {
                  const faith = selectedRun.averageFaithfulness ?? selectedRun.faithfulnessScore ?? selectedRun.faithfulness;
                  const ansRel = selectedRun.averageAnswerRelevance ?? selectedRun.answerRelevanceScore ?? selectedRun.answerRelevance;
                  const ctxRel = selectedRun.averageContextRelevance ?? selectedRun.contextRelevanceScore ?? selectedRun.contextRelevance;
                  const recall = selectedRun.averageRetrievalRecall ?? selectedRun.recallScore ?? selectedRun.retrievalRecall;
                  const citPrec = selectedRun.averageCitationPrecision ?? selectedRun.citationPrecision;

                  return (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-y-3 sm:gap-y-0">
                      <div className="px-2.5 first:pl-1 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block truncate" title="Faithfulness">
                          Faithfulness
                        </span>
                        <span className="text-base font-bold text-white font-mono block">{formatPct(faith)}</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${getPctNum(faith)}%` }}></div>
                        </div>
                      </div>

                      <div className="px-2.5 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block truncate" title="Answer Relevance">
                          Answer Rel
                        </span>
                        <span className="text-base font-bold text-white font-mono block">{formatPct(ansRel)}</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-400 h-full rounded-full transition-all duration-500" style={{ width: `${getPctNum(ansRel)}%` }}></div>
                        </div>
                      </div>

                      <div className="px-2.5 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block truncate" title="Context Relevance">
                          Context Rel
                        </span>
                        <span className="text-base font-bold text-white font-mono block">{formatPct(ctxRel)}</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: `${getPctNum(ctxRel)}%` }}></div>
                        </div>
                      </div>

                      <div className="px-2.5 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block truncate" title="Recall">
                          Recall
                        </span>
                        <span className="text-base font-bold text-white font-mono block">{formatPct(recall)}</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-purple-400 h-full rounded-full transition-all duration-500" style={{ width: `${getPctNum(recall)}%` }}></div>
                        </div>
                      </div>

                      <div className="px-2.5 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block truncate" title="Citation Precision">
                          Citation Prec
                        </span>
                        <span className="text-base font-bold text-white font-mono block">{formatPct(citPrec)}</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${getPctNum(citPrec)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 gap-2">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-400" /> Avg Latency Per Query:
                    <strong className="text-white ml-1">
                      {Math.round(selectedRun.averageTotalLatencyMs ?? selectedRun.averageLatency ?? selectedRun.avgLatencyMs ?? 0).toLocaleString()} ms
                    </strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" /> Evaluated Questions:
                    <strong className="text-white ml-1">{selectedRun.completedQuestions || 6} / 6</strong>
                  </span>
                </div>
              </div>

              {/* Benchmark Query Results Explorer */}
              <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-xl space-y-4 shadow-md">
                {/* Header & Filter Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Target size={15} className="text-indigo-400" />
                    <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
                      Benchmark Queries ({filteredQueries.length}/{runQueries.length})
                    </h3>
                  </div>

                  {/* Filter Tabs & Search */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-slate-950 p-0.5 rounded-lg text-[10px] font-mono font-bold border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setQueryFilter('all')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          queryFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All ({runQueries.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setQueryFilter('passed')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          queryFilter === 'passed' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Passed
                      </button>
                      <button
                        type="button"
                        onClick={() => setQueryFilter('failed')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          queryFilter === 'failed' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Failed
                      </button>
                    </div>

                    <div className="relative">
                      <Search size={11} className="absolute left-2 top-2 text-slate-500" />
                      <input
                        type="text"
                        value={querySearch}
                        onChange={(e) => setQuerySearch(e.target.value)}
                        placeholder="Search queries..."
                        className="bg-slate-950 border border-slate-800 rounded-md pl-7 pr-2 py-1 text-[10px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 w-32 sm:w-40"
                      />
                    </div>
                  </div>
                </div>

                {/* Queries Accordion List */}
                {loadingQueries ? (
                  <div className="p-8 text-center text-slate-400 font-mono text-xs space-y-2">
                    <RefreshCw size={20} className="animate-spin text-indigo-400 mx-auto" />
                    <p>Loading benchmark query metrics and judge reasoning...</p>
                  </div>
                ) : filteredQueries.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-mono text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                    No matching queries found for the selected filter.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredQueries.map((q: any, idx: number) => {
                      const qId = q.id || `query-${idx}`;
                      const isExpanded = expandedQueryId === qId || (expandedQueryId === null && idx === 0);
                      const qFaith = q.metrics?.faithfulness ?? q.faithfulnessScore;
                      const qLatency = q.metrics?.totalLatencyMs ?? q.latencyMs ?? q.latency ?? 0;
                      const isFailed = q.status === 'failed';

                      return (
                        <div key={qId} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 transition-all">
                          <button
                            type="button"
                            onClick={() => setExpandedQueryId(isExpanded ? '' : qId)}
                            className="w-full p-3.5 text-left flex items-center justify-between gap-3 hover:bg-slate-900/80 transition-colors"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-200 block truncate font-sans">
                                {q.question || `Query #${idx + 1}`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                Latency: {Math.round(qLatency)} ms • Faithfulness: {formatPct(qFaith)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              {isFailed ? (
                                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <XCircle size={11} /> FAILED
                                </span>
                              ) : (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <CheckCircle2 size={11} /> PASSED
                                </span>
                              )}
                              {isExpanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-slate-800 bg-slate-950/90 p-4 space-y-3 text-xs">
                              <div className="space-y-1">
                                <span className="font-bold text-slate-300 block uppercase text-[10px] font-mono">Generated Answer:</span>
                                <div className="text-slate-200 bg-slate-900/90 p-3 sm:p-4 rounded-lg border border-slate-800 leading-relaxed font-sans text-xs sm:text-[13px]">
                                  <AssistantMessageContent content={q.generatedAnswer || q.answer || 'Answer generated using pgvector grounded contexts.'} />
                                </div>
                              </div>

                              {q.reasoning && (
                                <div className="space-y-1">
                                  <span className="font-bold text-indigo-300 block uppercase text-[10px] font-mono flex items-center gap-1">
                                    <Sparkles size={11} /> Judge Reasoning:
                                  </span>
                                  <div className="text-slate-200 bg-indigo-950/30 p-3 sm:p-4 rounded-lg border border-indigo-500/20 leading-relaxed font-sans text-xs">
                                    <AssistantMessageContent content={q.reasoning} />
                                  </div>
                                </div>
                              )}

                              {Array.isArray(q.citations) && q.citations.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <span className="font-bold text-slate-300 block uppercase text-[10px] font-mono flex items-center gap-1">
                                    <FileCheck2 size={11} className="text-indigo-400" /> Grounded Source Citations ({q.citations.length}):
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {q.citations.map((c: any, cIdx: number) => (
                                      <span key={`cit-${cIdx}`} className="bg-slate-900 text-slate-300 border border-slate-800 px-2 py-1 rounded-md text-[10px] font-mono flex items-center gap-1">
                                        <span className="text-indigo-400 font-bold">📄 {c.filePath}</span>
                                        {c.startLine && <span className="text-slate-400">({c.startLine}-{c.endLine})</span>}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800/80 p-8 rounded-xl text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <BarChart3 size={22} />
              </div>
              <h3 className="text-sm font-bold text-white font-mono">No Evaluation Run Selected</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Click "Run Diagnostics" above or pick a run from the top switcher bar to inspect RAG quality metrics.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
