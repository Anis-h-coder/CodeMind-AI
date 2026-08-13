import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Database,
  Play,
  Sparkles,
  ShieldCheck,
  Table as TableIcon,
  Copy,
  Check,
  AlertTriangle,
  HelpCircle,
  History,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Code2,
  FileSpreadsheet,
  Key,
  Terminal,
  Search,
  Zap,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  Clock,
  Layers,
  ListFilter
} from 'lucide-react';

interface SqlCopilotProps {
  projectId: string;
}

interface SqlQueryResult {
  question: string;
  sql: string;
  explanation: string;
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
}

interface QueryHistoryItem {
  id: string;
  naturalLanguageQuestion: string;
  generatedSql: string;
  executionTime: number;
  rowCount: number;
  createdAt: string;
}

interface TableSchemaInfo {
  tableName: string;
  columns: {
    columnName: string;
    dataType: string;
    isNullable: boolean;
    isPrimaryKey: boolean;
    foreignKeyRef?: string;
  }[];
}

export default function SqlCopilot({ projectId }: SqlCopilotProps) {
  const [question, setQuestion] = useState('Show the 10 most recently created projects.');
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<{ error: string; stage?: string; errorType?: string } | null>(null);

  // Explanation state
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Schema & History states
  const [tables, setTables] = useState<TableSchemaInfo[]>([]);
  const [schemaSearch, setSchemaSearch] = useState('');
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([
    "Show the 10 most recently created projects.",
    "How many projects does each user have?",
    "List all repositories and their last indexed time.",
    "Show the number of files indexed for each repository.",
    "Which projects have the most indexed files?"
  ]);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [expandedCell, setExpandedCell] = useState<{ rowIdx: number; colName: string; val: string } | null>(null);
  const [expandedSchemaTable, setExpandedSchemaTable] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchSchema();
      fetchHistory();
    }
  }, [projectId]);

  const fetchSchema = async () => {
    try {
      const data = await api.sql.schema(projectId);
      if (data.success) {
        if (data.tables && Array.isArray(data.tables)) {
          setTables(data.tables);
          if (data.tables.length > 0) {
            setExpandedSchemaTable(data.tables[0].tableName);
          }
        }
        if (data.exampleQuestions && Array.isArray(data.exampleQuestions)) setExampleQuestions(data.exampleQuestions);
      }
    } catch (err: any) {
      console.error('Failed to fetch database schema:', err.message);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.sql.history(projectId);
      if (data.success && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    } catch (err: any) {
      console.error('Failed to fetch SQL query history:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExecute = async (qToRun?: string) => {
    const queryToExecute = qToRun || question;
    if (!queryToExecute.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setQueryResult(null);
    setExplanation(null);
    setShowExplanation(false);

    try {
      const data = await api.sql.query(projectId, queryToExecute.trim());

      setQueryResult({
        question: data.question,
        sql: data.sql,
        explanation: data.explanation,
        columns: data.columns || [],
        rows: data.rows || [],
        rowCount: data.rowCount || 0,
        executionTimeMs: data.executionTimeMs || 0,
      });
      setExplanation(data.explanation);
      fetchHistory();
    } catch (err: any) {
      setErrorMsg({
        error: err.message || 'Error occurred while connecting to SQL Copilot.',
        stage: err.stage || 'execution',
        errorType: err.errorType,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!queryResult?.sql) return;
    if (explanation) {
      setShowExplanation(!showExplanation);
      return;
    }

    setExplaining(true);
    try {
      const data = await api.sql.explain(projectId, queryResult.sql);
      if (data.success && data.explanation) {
        setExplanation(data.explanation);
        setShowExplanation(true);
      }
    } catch (err: any) {
      console.error('Failed to explain query:', err.message);
    } finally {
      setExplaining(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSelectHistoryItem = (item: QueryHistoryItem) => {
    setQuestion(item.naturalLanguageQuestion);
    setQueryResult({
      question: item.naturalLanguageQuestion,
      sql: item.generatedSql,
      explanation: 'Historical query retrieved from project database logs.',
      columns: [],
      rows: [],
      rowCount: item.rowCount,
      executionTimeMs: item.executionTime,
    });
    setExplanation('Historical query retrieved from project database logs.');
    setShowExplanation(false);
    setErrorMsg(null);
  };

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to run
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const filteredTables = tables.filter(t => {
    if (!schemaSearch.trim()) return true;
    const term = schemaSearch.toLowerCase();
    return t.tableName.toLowerCase().includes(term) ||
      t.columns.some(c => c.columnName.toLowerCase().includes(term) || c.dataType.toLowerCase().includes(term));
  });

  const renderCellValue = (value: any, rowIdx: number, colName: string) => {
    if (value === null || value === undefined) {
      return <span className="text-slate-500 italic font-mono text-xs">null</span>;
    }
    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-0.5 text-[11px] rounded font-mono font-semibold ${value ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
          {value ? 'true' : 'false'}
        </span>
      );
    }
    if (typeof value === 'object') {
      const str = JSON.stringify(value);
      return <span className="font-mono text-slate-300 truncate block max-w-xs text-xs">{str}</span>;
    }

    const strVal = String(value);
    if (strVal.length > 40) {
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-200 truncate max-w-[200px] text-xs">{strVal}</span>
          <button
            type="button"
            onClick={() => setExpandedCell({ rowIdx, colName, val: strVal })}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-mono shrink-0 font-medium flex items-center gap-0.5"
          >
            <Maximize2 size={11} /> View
          </button>
        </div>
      );
    }

    return <span className="font-mono text-slate-200 text-xs">{strVal}</span>;
  };

  return (
    <div className="space-y-6 w-full animate-fade-in select-text pb-6">
      
      {/* Header & Status Banner */}
      <div className="bg-slate-900/70 border border-slate-800/80 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
            <Database size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight font-display">SQL Copilot</h2>
              <span className="text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> Read-Only Security Guardrails
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-sans max-w-xl">
              Synthesize production-safe PostgreSQL queries from natural language statements with schema introspection and automated plan verification.
            </p>
          </div>
        </div>

        {/* Database Engine Pills */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-1.5 flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-750 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-slate-200">PostgreSQL</span>
            </div>
            <div className="px-2.5 py-1 text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded-lg font-bold">
              Drizzle ORM
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Query Builder & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Prompt Editor & Schema Explorer */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Query Prompt Card */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Terminal size={14} className="text-indigo-400" />
                Prompt Editor
              </label>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded font-medium">
                ⌘ + Enter to execute
              </span>
            </div>

            {/* Input Textarea */}
            <div className="relative bg-slate-950 rounded-xl border border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-3">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Ask a question about your schema..."
                className="w-full bg-transparent font-mono text-xs sm:text-sm text-cyan-200 placeholder-slate-500 focus:outline-none resize-none min-h-[95px] leading-relaxed"
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-indigo-400">
                  <Zap size={12} /> Auto-validates SELECT statements
                </span>
                <span>{question.length} chars</span>
              </div>
            </div>

            {/* Query Template Chips */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Preset Queries:</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {exampleQuestions.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuestion(ex);
                      handleExecute(ex);
                    }}
                    className="w-full text-xs bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl transition-all text-left flex items-start gap-2.5 active:scale-[0.99] group"
                  >
                    <Sparkles size={13} className="text-indigo-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium line-clamp-2 text-slate-200 group-hover:text-white">{ex}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Execute Button */}
            <button
              type="button"
              onClick={() => handleExecute()}
              disabled={loading || !question.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.99] disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 min-h-[44px] font-mono"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-indigo-100" />
                  <span>Synthesizing SQL Query...</span>
                </>
              ) : (
                <>
                  <Play size={15} className="fill-current" />
                  <span>Execute AI Query</span>
                </>
              )}
            </button>
          </div>

          {/* Database Schema Navigator */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <TableIcon size={16} className="text-indigo-400 shrink-0" />
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Schema Inspector</h3>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-800/80 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-700/60">
                {tables.length} tables
              </span>
            </div>

            {/* Search Schema Field */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={schemaSearch}
                onChange={(e) => setSchemaSearch(e.target.value)}
                placeholder="Search tables or columns..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Tables List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {filteredTables.length === 0 ? (
                <div className="p-4 text-center text-slate-500 font-mono text-xs">
                  No tables matching search term.
                </div>
              ) : (
                filteredTables.map((t) => {
                  const isExpanded = expandedSchemaTable === t.tableName;
                  return (
                    <div key={t.tableName} className="border border-slate-800 bg-slate-950/60 rounded-xl overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => setExpandedSchemaTable(isExpanded ? null : t.tableName)}
                        className={`w-full flex items-center justify-between p-3 text-xs font-mono text-left transition-colors ${
                          isExpanded ? 'bg-indigo-950/40 text-indigo-300 font-bold border-b border-indigo-500/20' : 'text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <span className="font-bold flex items-center gap-2 truncate">
                          <TableIcon size={14} className={isExpanded ? 'text-indigo-400' : 'text-slate-500'} />
                          {t.tableName}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 font-normal">{t.columns.length} cols</span>
                          {isExpanded ? <ChevronUp size={14} className="text-indigo-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="bg-slate-950/90 p-3 space-y-1.5 text-xs font-mono">
                          {t.columns.map((c) => (
                            <div key={c.columnName} className="flex items-center justify-between gap-2 py-1 border-b border-slate-900 last:border-0">
                              <div className="flex items-center gap-2 truncate">
                                {c.isPrimaryKey ? (
                                  <span title="Primary Key"><Key size={12} className="text-amber-400 shrink-0" /></span>
                                ) : (
                                  <span className="w-1.5 h-1.5 bg-slate-600 rounded-full shrink-0"></span>
                                )}
                                <span className={`truncate ${c.isPrimaryKey ? 'text-amber-300 font-bold' : 'text-slate-200'}`}>
                                  {c.columnName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-cyan-400 text-[11px]">{c.dataType}</span>
                                {c.foreignKeyRef && (
                                  <span className="bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.2 rounded text-[9px] text-purple-300 font-bold">
                                    FK
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Compiled SQL, Output Matrix & Logs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Error Display */}
          {errorMsg && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl space-y-2 animate-fade-in shadow-md">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertTriangle size={16} className="shrink-0 text-rose-400" />
                <span>SQL Compilation or Execution Error</span>
              </div>
              <p className="text-xs font-mono text-rose-200 leading-relaxed break-words bg-slate-950/80 p-3 rounded-xl border border-rose-500/20">
                {typeof errorMsg.error === 'object'
                  ? ((errorMsg.error as any)?.message || JSON.stringify(errorMsg.error))
                  : String(errorMsg.error)}
              </p>
            </div>
          )}

          {/* Compiled SQL Block */}
          {queryResult && (
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-md space-y-0">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Code2 size={15} className="text-indigo-400 shrink-0" />
                  <span className="text-white font-mono font-bold">Compiled PostgreSQL Statement</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExplain}
                    disabled={explaining}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 font-semibold"
                  >
                    {explaining ? <RefreshCw size={13} className="animate-spin" /> : <HelpCircle size={13} />}
                    <span>{showExplanation ? 'Hide Logic' : 'Explain Query'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(queryResult.sql)}
                    className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center justify-center"
                    title="Copy SQL code block"
                  >
                    {copiedSql ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              {/* Code Box */}
              <pre className="p-4 bg-[#0a0e17] font-mono text-xs sm:text-sm text-cyan-300 overflow-x-auto border-b border-slate-800 leading-relaxed whitespace-pre-wrap break-all sm:whitespace-pre">
                <code>{queryResult.sql}</code>
              </pre>

              {/* AI Logic Explanation Card */}
              {showExplanation && (
                <div className="p-4 bg-indigo-950/40 border-b border-indigo-500/20 flex items-start gap-3 text-xs text-indigo-200 animate-fade-in">
                  <Sparkles size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-indigo-300 uppercase text-[10px] tracking-wider font-mono block">AI Execution Reasoning:</span>
                    <p className="text-slate-200 leading-relaxed text-xs sm:text-sm font-sans">{explanation}</p>
                  </div>
                </div>
              )}

              {/* Execution Summary Bar */}
              <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> {queryResult.rowCount} rows retrieved
                </span>
                <span className="text-indigo-400 font-semibold flex items-center gap-1">
                  <Clock size={13} /> {queryResult.executionTimeMs} ms
                </span>
              </div>
            </div>
          )}

          {/* Output Data Table Matrix */}
          {queryResult && (
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-md space-y-0">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  <FileSpreadsheet size={15} className="text-indigo-400 shrink-0" />
                  Result Dataset
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-0.5 border border-slate-800 rounded-md font-bold">
                  {queryResult.rows.length} records
                </span>
              </div>

              <div className="overflow-x-auto max-h-[420px] overflow-y-auto custom-scrollbar bg-slate-950/80">
                {queryResult.rows.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-mono text-xs">
                    0 records returned for this query.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300 font-mono text-xs">
                        {queryResult.columns.map((col) => (
                          <th key={col} className="p-3 font-bold uppercase tracking-wider whitespace-nowrap sticky top-0 bg-slate-900 z-10 border-r border-slate-800 last:border-r-0">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {queryResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-850 transition-colors odd:bg-slate-900/30">
                          {queryResult.columns.map((col) => (
                            <td key={col} className="p-3 text-slate-200 whitespace-nowrap max-w-xs truncate text-xs border-r border-slate-850 last:border-r-0 font-mono">
                              {renderCellValue(row[col], rIdx, col)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Empty Placeholder State */}
          {!queryResult && !errorMsg && (
            <div className="bg-slate-900/50 border border-slate-800/80 p-10 rounded-2xl text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight font-display">PostgreSQL Engine Ready</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mt-1 font-sans">
                  Select a preset query template or enter a prompt on the left to compile and execute safe read-only SQL queries.
                </p>
              </div>
            </div>
          )}

          {/* Historical Query Logs */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <History size={16} className="text-indigo-400 shrink-0" />
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Query Execution History</h3>
              </div>
              <button
                type="button"
                onClick={fetchHistory}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors font-medium font-mono"
              >
                <RefreshCw size={12} className={historyLoading ? 'animate-spin' : ''} />
                <span>Sync History</span>
              </button>
            </div>

            {history.length === 0 ? (
              <div className="p-4 text-center text-slate-500 font-mono text-xs">
                No previous queries executed yet.
              </div>
            ) : (
              <div className="overflow-x-auto divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950/60 max-h-60 overflow-y-auto custom-scrollbar">
                {history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => handleSelectHistoryItem(h)}
                    className="p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-slate-200 font-semibold break-words flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
                        {h.naturalLanguageQuestion}
                      </div>
                      <div className="text-slate-400 text-xs truncate pl-4 font-mono">{h.generatedSql}</div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0 font-mono">
                      <span className="bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded text-slate-300 font-medium">{h.rowCount} rows</span>
                      <span className="bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded text-indigo-300 font-semibold">{Math.round(h.executionTime)} ms</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Expanded Cell Value Modal */}
      {expandedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white uppercase font-mono">Cell Value: {expandedCell.colName}</span>
              <button
                type="button"
                onClick={() => setExpandedCell(null)}
                className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors font-medium font-mono"
              >
                Close
              </button>
            </div>
            <textarea
              readOnly
              value={expandedCell.val}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-cyan-200 focus:outline-none"
            />
          </div>
        </div>
      )}

    </div>
  );
}

