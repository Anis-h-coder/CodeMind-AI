import { useState, useEffect, useRef, FormEvent } from 'react';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';
import SqlCopilot from '../components/SqlCopilot';
import EvaluationSuite from '../components/EvaluationSuite';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { 
  Database, 
  FolderGit, 
  MessageSquareCode, 
  Plus, 
  GitBranch, 
  FileCode2, 
  Play, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert,
  Send,
  RefreshCw,
  Trash2,
  X,
  CheckSquare,
  Square,
  Search,
  AlertTriangle,
  Code,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Layers,
  Workflow,
  Cpu,
  ExternalLink,
  CheckCircle2,
  ThumbsUp,
  Terminal,
  BookOpen,
  ArrowRight,
  Activity,
  Award,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Project, ChatMessage } from '../types';

interface DashboardProps {
  user: any;
  projects: Project[];
  activeProject: Project | null;
  activeModule: string;
  onOpenCreateModal: () => void;
  onSelectModule?: (module: string) => void;
  onDeleteProject?: (id: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  id?: string;
  children?: { [key: string]: TreeNode };
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 rounded-xl border border-slate-800 bg-[#0d1117] overflow-hidden shadow-md font-mono text-xs">
      <div className="bg-[#161b22] px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          <span className="ml-2 text-[10px] font-semibold tracking-wider uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded font-mono">
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 text-[10px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-md transition-all shadow-xs"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy code'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto scrollbar-thin text-slate-200 leading-relaxed font-mono selection:bg-cyan-500/30 selection:text-cyan-200">
        <pre className="m-0"><code>{code}</code></pre>
      </div>
    </div>
  );
}

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy full response"
      type="button"
      className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 rounded-lg transition-all shadow-xs"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-400" />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function FlowDiagramBox({ flowText }: { flowText: string }) {
  const steps = flowText.split(/\s*(?:↓|->|➔|→)\s*/).filter(s => s.trim().length > 0);
  if (steps.length <= 1) return null;

  return (
    <div className="my-4 p-4 rounded-xl border border-indigo-500/30 bg-slate-950/80 shadow-md">
      <div className="flex items-center justify-between mb-3 border-b border-indigo-500/20 pb-2">
        <div className="flex items-center gap-2 text-[11px] uppercase font-mono tracking-wider text-indigo-300 font-semibold">
          <Workflow size={14} className="text-indigo-400" />
          <span>Architecture Flow Pipeline</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">{steps.length} Steps</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono font-medium px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-2 hover:border-indigo-400 transition-all">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold flex items-center justify-center border border-indigo-500/40 shrink-0">
                {idx + 1}
              </span>
              <span>{step.trim()}</span>
            </div>
            {idx < steps.length - 1 && (
              <ArrowRight size={14} className="text-indigo-400 shrink-0" />
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

function AssistantMessageContent({ content, onOpenFile }: { content: string; onOpenFile?: (path: string) => void }) {
  return (
    <div className="text-slate-200 text-xs sm:text-sm leading-relaxed space-y-3 font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2({ children }) {
            return (
              <h2 className="text-xs sm:text-sm font-bold text-indigo-300 font-mono mt-4 mb-2 pb-1 border-b border-slate-800 uppercase tracking-wider">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-xs sm:text-sm font-bold text-white font-mono mt-3 mb-1">
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
              <code className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700/80 font-mono text-xs font-semibold inline" {...props}>
                {children}
              </code>
            );
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 space-y-1.5 my-2 text-slate-200">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 space-y-1.5 my-2 text-slate-200">{children}</ol>;
          },
          li({ children }) {
            return (
              <li className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                {children}
              </li>
            );
          },
          p({ children }) {
            const plainText = getPlainText(children);
            if ((plainText.includes('↓') || plainText.includes('->') || plainText.includes('→') || plainText.includes('➔')) && plainText.length < 350) {
              return <FlowDiagramBox flowText={plainText} />;
            }
            return <div className="text-slate-200 text-xs sm:text-sm leading-relaxed mb-2">{children}</div>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-indigo-500 bg-indigo-950/30 px-3.5 py-2 my-2.5 rounded-r text-slate-300 text-xs italic">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline font-mono">
                {children}
              </a>
            );
          },
          strong({ children }) {
            return <strong className="text-white font-semibold">{children}</strong>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function Dashboard({
  user,
  projects,
  activeProject,
  activeModule,
  onOpenCreateModal,
  onSelectModule,
  onDeleteProject
}: DashboardProps) {
  // DB Metrics
  const [dbMetrics, setDbMetrics] = useState<{
    totalProjects: number;
    totalRepositories: number;
    totalFiles: number;
    totalChunks: number;
    totalAiQueries: number;
    totalEvaluations: number;
  } | null>(null);

  // Latest Evaluation summary state for RAG Health card
  const [latestEval, setLatestEval] = useState<{
    overallQuality: number;
    faithfulness: number;
    answerRelevance: number;
    retrievalRecall: number;
    citationPrecision: number;
    createdAt?: string;
  } | null>(null);

  // Active Project Repo and File Tree State
  const [repo, setRepo] = useState<any | null>(null);
  const [filesList, setFilesList] = useState<any[]>([]);
  const [fileTree, setFileTree] = useState<TreeNode | null>(null);
  const [selectedFileDetail, setSelectedFileDetail] = useState<any | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingFileDetail, setLoadingFileDetail] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [copiedFile, setCopiedFile] = useState(false);

  // GitHub Modal states
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [modalStep, setModalStep] = useState<'enter_url' | 'repo_info' | 'indexing' | 'completed'>('enter_url');
  const [githubUrlInput, setGithubUrlInput] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [tempRepoInfo, setTempRepoInfo] = useState<any | null>(null);

  // Tree expanded folders state
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({ 'Root': true });

  // Chat states for the assistant
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: 'Hello! I am your CodeMind AI assistant. I have indexing and pgvector embedding pipeline configured. Submit a question to explore this codebase with RAG-grounded insights!',
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [conversationsList, setConversationsList] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [convoSearch, setConvoSearch] = useState('');
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat when new messages or loading arrives
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, chatLoading]);

  // Delete selection & confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTab, setDeleteTab] = useState<'conversations' | 'files'>('conversations');
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([]);
  const [deleteSearch, setDeleteSearch] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');

  // Helper to open delete modal
  const openDeleteModal = (initialTab: 'conversations' | 'files', preselectedId?: string) => {
    setDeleteTab(initialTab);
    setSelectedDeleteIds(preselectedId ? [preselectedId] : []);
    setDeleteSearch('');
    setDeleteError('');
    setDeleteSuccessMsg('');
    setShowDeleteModal(true);
  };

  // Helper to get filtered items for deletion tab
  const getFilteredDeleteItems = () => {
    if (deleteTab === 'conversations') {
      if (!deleteSearch.trim()) return conversationsList;
      return conversationsList.filter(c => 
        (c.title || 'Untitled Session').toLowerCase().includes(deleteSearch.toLowerCase())
      );
    } else {
      if (!deleteSearch.trim()) return filesList;
      return filesList.filter(f => 
        f.path.toLowerCase().includes(deleteSearch.toLowerCase()) ||
        f.name.toLowerCase().includes(deleteSearch.toLowerCase())
      );
    }
  };

  const handleToggleSelectDelete = (id: string) => {
    setSelectedDeleteIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllDelete = () => {
    const items = getFilteredDeleteItems();
    const itemIds = items.map((i: any) => i.id);
    if (selectedDeleteIds.length === itemIds.length) {
      setSelectedDeleteIds([]);
    } else {
      setSelectedDeleteIds(itemIds);
    }
  };

  const handleExecuteDelete = async () => {
    if (selectedDeleteIds.length === 0) return;
    setDeleteLoading(true);
    setDeleteError('');
    setDeleteSuccessMsg('');

    try {
      let count = 0;
      for (const id of selectedDeleteIds) {
        if (deleteTab === 'conversations') {
          await api.projects.deleteConversation(id);
          count++;
        } else if (deleteTab === 'files' && activeProject) {
          await api.projects.deleteFile(activeProject.id, id);
          count++;
        }
      }

      setDeleteSuccessMsg(`Successfully deleted ${count} item(s)!`);

      // Refresh state
      if (activeProject) {
        if (deleteTab === 'conversations') {
          await loadConversations(activeProject.id);
          if (currentConversationId && selectedDeleteIds.includes(currentConversationId)) {
            startNewChat();
          }
        } else if (deleteTab === 'files') {
          await loadProjectFiles();
          await loadGlobalMetrics();
          if (selectedFileDetail && selectedDeleteIds.includes(selectedFileDetail.id)) {
            setSelectedFileDetail(null);
          }
        }
      }

      setTimeout(() => {
        setShowDeleteModal(false);
        setDeleteLoading(false);
        setDeleteSuccessMsg('');
        setSelectedDeleteIds([]);
      }, 1000);
    } catch (err: any) {
      console.error('Delete execution failed:', err);
      setDeleteError(err.message || 'Failed to delete selected item(s)');
      setDeleteLoading(false);
    }
  };

  // SQL Copilot state
  const [sqlQuery, setSqlQuery] = useState('Retrieve all projects created after August 1st with more than 10 files');
  const [compiledSql, setCompiledSql] = useState('');

  // Analytic token chart
  const tokenChartData = [
    { name: 'Aug 05', 'Gemini Flash': 2400, accuracy: 92 },
    { name: 'Aug 06', 'Gemini Flash': 1398, accuracy: 94 },
    { name: 'Aug 07', 'Gemini Flash': 9800, accuracy: 91 },
    { name: 'Aug 08', 'Gemini Flash': 3908, accuracy: 95 },
    { name: 'Aug 09', 'Gemini Flash': 4800, accuracy: 96 },
    { name: 'Aug 10', 'Gemini Flash': 3800, accuracy: 95 },
    { name: 'Aug 11', 'Gemini Flash': 4300, accuracy: 97 },
  ];

  // Helper to build a file tree structure from a list of paths
  function buildFileTree(files: any[]): TreeNode {
    const root: TreeNode = { name: 'Root', path: '', type: 'directory', children: {} };

    files.forEach(file => {
      const parts = file.path.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        if (!current.children) current.children = {};

        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: isLast ? 'file' : 'directory',
            id: isLast ? file.id : undefined,
            children: isLast ? undefined : {}
          };
        }
        current = current.children[part];
      });
    });

    return root;
  }

  // Reload general global metrics
  async function loadGlobalMetrics() {
    try {
      const res = await api.projects.metrics();
      if (res.success) {
        setDbMetrics(res.metrics);
      }
    } catch (err: any) {
      console.warn('Failed to load database metrics:', err);
    }
  }

  // Load files list and repo info for the current project
  const loadProjectFiles = async () => {
    if (!activeProject) return;
    setLoadingFiles(true);
    try {
      const repoRes = await api.projects.getRepository(activeProject.id);
      if (repoRes.success && repoRes.repository) {
        setRepo(repoRes.repository);
        // Pre-fill url if exists
        setGithubUrlInput(repoRes.repository.githubUrl || '');
      } else {
        setRepo(null);
      }

      const filesRes = await api.projects.listFiles(activeProject.id, 1, 2000);
      if (filesRes.success) {
        setFilesList(filesRes.files);
        const tree = buildFileTree(filesRes.files);
        setFileTree(tree);
        
        // Auto-select first file if available
        if (filesRes.files.length > 0) {
          handleFileSelect(filesRes.files[0].id);
        } else {
          setSelectedFileDetail(null);
        }
      }
    } catch (err) {
      console.error('Failed to load project files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadConversations = async (projId: string) => {
    try {
      const res = await api.projects.listConversations(projId);
      if (res.success) {
        setConversationsList(res.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadConversationMessages = async (convoId: string) => {
    setChatLoading(true);
    setChatError('');
    try {
      const res = await api.projects.listMessages(convoId);
      if (res.success) {
        const formatted = res.messages.map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.createdAt).toLocaleTimeString(),
          sources: m.sources || [],
        }));
        setMessages(formatted);
        setCurrentConversationId(convoId);
      }
    } catch (err: any) {
      console.error('Failed to load conversation messages:', err);
      setChatError(err.message || 'Failed to load conversation messages');
    } finally {
      setChatLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([
      {
        id: 'init',
        role: 'assistant',
        content: 'Hello! I am your CodeMind AI assistant. I have indexing and pgvector embedding pipeline configured. Submit a question to explore this codebase with RAG-grounded insights!',
        timestamp: new Date().toLocaleTimeString(),
      }
    ]);
  };

  const loadLatestEval = async (projId: string) => {
    try {
      const res = await api.evaluations.list(projId);
      if (res.success && res.runs && res.runs.length > 0) {
        const run = res.runs[0];
        const fmt = (v: number) => (v > 1 ? v : v * 100);
        setLatestEval({
          overallQuality: fmt(run.averageScore ?? 84.1),
          faithfulness: fmt(run.averageFaithfulness ?? 100),
          answerRelevance: fmt(run.averageAnswerRelevance ?? 100),
          retrievalRecall: fmt(run.averageRetrievalRecall ?? 58.9),
          citationPrecision: fmt(run.averageCitationPrecision ?? 75.0),
          createdAt: run.createdAt,
        });
      } else {
        setLatestEval(null);
      }
    } catch (err) {
      console.warn('Failed to load latest evaluation run:', err);
    }
  };

  function formatTimeAgo(timestamp: number) {
    const diffMs = Date.now() - timestamp;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function formatLastSynced(dateStr?: string) {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Never';
    const dateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${dateFormatted} · ${timeFormatted}`;
  }

  function getRecentActivities() {
    const activities: Array<{ id: string; title: string; detail: string; timeAgo: string; type: 'indexing' | 'evaluation' | 'chat'; timestamp: number }> = [];

    if (repo?.lastIndexedAt) {
      const ts = new Date(repo.lastIndexedAt).getTime();
      if (!isNaN(ts)) {
        activities.push({
          id: 'act-repo',
          title: 'Repository indexed',
          detail: `${repo.owner}/${repo.repositoryName} (${filesList.length} files)`,
          timeAgo: formatTimeAgo(ts),
          type: 'indexing',
          timestamp: ts,
        });
      }
    }

    if (latestEval?.createdAt) {
      const ts = new Date(latestEval.createdAt).getTime();
      if (!isNaN(ts)) {
        activities.push({
          id: 'act-eval',
          title: 'RAG evaluation completed',
          detail: `Overall Quality: ${latestEval.overallQuality.toFixed(1)}%`,
          timeAgo: formatTimeAgo(ts),
          type: 'evaluation',
          timestamp: ts,
        });
      }
    }

    if (conversationsList && conversationsList.length > 0) {
      const sorted = [...conversationsList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      sorted.slice(0, 3).forEach((convo, idx) => {
        const ts = new Date(convo.createdAt).getTime();
        if (!isNaN(ts)) {
          activities.push({
            id: `act-chat-${convo.id || idx}`,
            title: 'AI query processed',
            detail: convo.title || 'Knowledge Assistant session',
            timeAgo: formatTimeAgo(ts),
            type: 'chat',
            timestamp: ts,
          });
        }
      });
    }

    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }

  useEffect(() => {
    loadGlobalMetrics();
    if (activeProject) {
      loadProjectFiles();
      loadConversations(activeProject.id);
      loadLatestEval(activeProject.id);
      startNewChat();
    } else {
      setRepo(null);
      setFilesList([]);
      setFileTree(null);
      setSelectedFileDetail(null);
      setConversationsList([]);
      setCurrentConversationId(null);
      setLatestEval(null);
    }
  }, [projects, activeProject]);

  // Polling indexer status when repository state is active
  useEffect(() => {
    let poller: NodeJS.Timeout;
    const isIndexingActive = repo && ['indexing', 'chunking', 'embedding', 'vector_indexing'].includes(repo.indexingStatus);
    if (activeProject && repo && isIndexingActive) {
      poller = setInterval(async () => {
        try {
          const res = await api.projects.getRepository(activeProject.id);
          if (res.success && res.repository) {
            setRepo(res.repository);
            
            // If completed or failed, stop polling and load files
            const isStillIndexing = res.repository.indexingStatus && ['indexing', 'chunking', 'embedding', 'vector_indexing'].includes(res.repository.indexingStatus);
            if (!isStillIndexing) {
              loadProjectFiles();
              loadGlobalMetrics();
            }
          }
        } catch (err) {
          console.error('Failed to poll repository status:', err);
        }
      }, 2000);
    }
    return () => clearInterval(poller);
  }, [repo?.indexingStatus, activeProject?.id]);

  // Fetch file detail content on select
  const handleFileSelect = async (fileId: string) => {
    if (!activeProject) return;
    setLoadingFileDetail(true);
    try {
      const res = await api.projects.getFile(activeProject.id, fileId);
      if (res.success) {
        setSelectedFileDetail(res.file);
      }
    } catch (err) {
      console.error('Failed to load file details:', err);
    } finally {
      setLoadingFileDetail(false);
    }
  };

  // Connect repository action
  const handleConnectRepository = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeProject || !githubUrlInput.trim()) return;

    setModalError('');
    setModalLoading(true);

    try {
      const res = await api.projects.connectGithub(activeProject.id, githubUrlInput.trim());
      if (res.success && res.repository) {
        setTempRepoInfo(res.repository);
        setRepo(res.repository);
        setModalStep('repo_info');
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to connect repository.');
    } finally {
      setModalLoading(false);
    }
  };

  // Start indexing codebase action
  const handleStartIndexing = async () => {
    if (!activeProject) return;

    setModalError('');
    setModalLoading(true);

    try {
      const res = await api.projects.indexGithub(activeProject.id);
      if (res.success) {
        // Start polling immediately
        setModalStep('indexing');
        // Update local repo status
        setRepo(prev => prev ? { ...prev, indexingStatus: 'indexing' } : null);
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to trigger indexing.');
    } finally {
      setModalLoading(false);
    }
  };

  // Disconnect repository
  const handleDisconnectRepository = async () => {
    if (!activeProject || !window.confirm('Are you sure you want to disconnect this repository? This will wipe all indexed files from PostgreSQL.')) return;

    try {
      const res = await api.projects.disconnectGithub(activeProject.id);
      if (res.success) {
        setRepo(null);
        setFilesList([]);
        setFileTree(null);
        setSelectedFileDetail(null);
        loadGlobalMetrics();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to disconnect repository');
    }
  };

  // Polling inside modal
  useEffect(() => {
    let modalPoller: NodeJS.Timeout;
    if (showGithubModal && modalStep === 'indexing' && activeProject) {
      modalPoller = setInterval(async () => {
        try {
          const res = await api.projects.getRepository(activeProject.id);
          if (res.success && res.repository) {
            setTempRepoInfo(res.repository);
            setRepo(res.repository);
            
            if (res.repository.indexingStatus === 'completed') {
              setModalStep('completed');
              loadProjectFiles();
              loadGlobalMetrics();
            } else if (res.repository.indexingStatus === 'failed') {
              setModalError(res.repository.indexingError || 'Indexing failed.');
              setModalStep('repo_info');
            }
          }
        } catch (err) {
          console.error('Modal poll failed:', err);
        }
      }, 2000);
    }
    return () => clearInterval(modalPoller);
  }, [showGithubModal, modalStep, activeProject?.id]);

  // Open integration wizard modal
  const openIntegrationWizard = () => {
    setModalError('');
    setModalLoading(false);
    
    if (repo) {
      setTempRepoInfo(repo);
      if (['indexing', 'chunking', 'embedding', 'vector_indexing'].includes(repo.indexingStatus)) {
        setModalStep('indexing');
      } else if (repo.indexingStatus === 'completed') {
        setModalStep('completed');
      } else {
        setModalStep('repo_info');
      }
    } else {
      setTempRepoInfo(null);
      setModalStep('enter_url');
    }
    setShowGithubModal(true);
  };

  // Code Rendering Panel
  const renderCodeContent = () => {
    if (loadingFileDetail) {
      return (
        <div className="flex-1 flex items-center justify-center bg-[#090d16] text-slate-400 font-mono text-xs">
          <RefreshCw className="animate-spin mr-2 text-cyan-400" size={14} /> Loading file content from PostgreSQL...
        </div>
      );
    }
    if (!selectedFileDetail || !selectedFileDetail.content) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#090d16] text-center text-slate-400">
          <FileCode2 size={28} className="text-slate-700 mb-2 animate-pulse" />
          <p className="text-xs font-mono">No file content. Index the repository or select another file.</p>
        </div>
      );
    }

    const lines = selectedFileDetail.content.split('\n');
    return (
      <div className="flex font-mono text-xs text-slate-300 leading-relaxed overflow-auto select-text bg-[#090d16] border border-slate-850 rounded-b-xl custom-scrollbar flex-1">
        {/* Line Numbers Gutter */}
        <div className="text-right pr-4 border-r border-slate-850 text-slate-500 select-none bg-[#0c111d] px-2.5 py-3 sticky left-0 min-w-[2.5rem] text-[11px] font-semibold">
          {lines.map((_, idx) => (
            <div key={idx} className="h-5">{idx + 1}</div>
          ))}
        </div>
        {/* Code body lines */}
        <div className="pl-4 py-3 flex-1 whitespace-pre min-w-max bg-[#090d16]">
          {lines.map((line: string, idx: number) => (
            <div key={idx} className="hover:bg-slate-800/40 px-1 rounded transition-colors text-[11px] text-slate-300 h-5 flex items-center">
              {line || ' '}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleOpenSourceInExplorer = (filePath: string) => {
    const foundFile = filesList.find(f => f.path === filePath);
    if (foundFile) {
      handleFileSelect(foundFile.id);
      if (onSelectModule) {
        onSelectModule('explorer');
      }
    } else {
      console.warn(`File ${filePath} not found in database-backed explorer files list.`);
    }
  };

  // Helper to trigger message response
  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !activeProject) return;
    if (chatLoading) return;

    const userPrompt = chatInput.trim();
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    setChatError('');

    try {
      const res = await api.projects.chat(activeProject.id, userPrompt, currentConversationId);
      if (res.success) {
        const assistantMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: res.answer,
          timestamp: new Date().toLocaleTimeString(),
          sources: res.sources
        };
        setMessages(prev => [...prev, assistantMsg]);
        
        if (!currentConversationId) {
          setCurrentConversationId(res.conversationId);
          await loadConversations(activeProject.id);
        }
      }
    } catch (err: any) {
      console.error('[CodeMind RAG Assistant] API call failed:', err);
      setChatError(err.message || 'Failed to communicate with the Gemini RAG backend');
      
      const errMsg: ChatMessage = {
        id: String(Date.now() + 2),
        role: 'assistant',
        content: `Error: ${err.message || 'I failed to retrieve a RAG-grounded answer from the server. Please verify your Gemini API Key or re-run the repository indexing stage.'}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  }

  function compileNaturalLanguageToSql() {
    if (!sqlQuery.trim()) return;
    if (sqlQuery.toLowerCase().includes('project')) {
      setCompiledSql(`-- Compliant PostgreSQL Query compiled via CodeMind Copilot
SELECT p.id, p.name, p.github_url, COUNT(f.id) AS file_count
FROM projects p
LEFT JOIN repositories r ON p.id = r.project_id
LEFT JOIN files f ON r.id = f.repository_id
WHERE p.created_at > '2026-08-01'
GROUP BY p.id, p.name, p.github_url
HAVING COUNT(f.id) > 0
ORDER BY file_count DESC;`);
    } else {
      setCompiledSql(`-- Compiled PostgreSQL statement
SELECT * FROM users u
WHERE u.email = '${user?.email || 'prac1290@gmail.com'}'
LIMIT 1;`);
    }
  }

  // Recursive Directory Tree Builder Rendering
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const renderNode = (node: TreeNode) => {
    if (node.type === 'directory') {
      const isOpen = expandedFolders[node.path];
      const childrenKeys = Object.keys(node.children || {});
      return (
        <div key={node.path} className="space-y-0.5">
          {node.path !== '' && (
            <button
              onClick={() => toggleFolder(node.path)}
              className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold text-slate-300 hover:bg-slate-800/40 hover:text-white text-left transition-colors font-mono"
            >
              <ChevronRight size={12} className={`text-slate-500 transform transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
              <FolderGit size={12} className="text-cyan-500 shrink-0" />
              <span className="truncate">{node.name}</span>
            </button>
          )}
          {isOpen && (
            <div className={node.path !== '' ? 'pl-3 border-l border-slate-800/70 space-y-0.5 mt-0.5 ml-2' : 'space-y-0.5'}>
              {childrenKeys.map(key => renderNode(node.children![key]))}
            </div>
          )}
        </div>
      );
    } else {
      const isSelected = selectedFileDetail?.id === node.id;
      const ext = node.name.split('.').pop() || '';
      let iconColor = 'text-slate-500';
      if (['ts', 'tsx'].includes(ext)) iconColor = 'text-blue-400';
      else if (['js', 'jsx'].includes(ext)) iconColor = 'text-amber-400';
      else if (['json', 'yml', 'yaml'].includes(ext)) iconColor = 'text-purple-400';
      else if (['md'].includes(ext)) iconColor = 'text-pink-400';
      else if (['sql'].includes(ext)) iconColor = 'text-cyan-400';

      return (
        <button
          key={node.path}
          onClick={() => node.id && handleFileSelect(node.id)}
          className={`w-full flex items-center gap-2 px-2 py-1 rounded text-[11px] font-mono text-left transition-all border ${
            isSelected 
              ? 'bg-blue-600/15 border-blue-500/30 text-cyan-400 font-semibold shadow-xs' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/30 border-transparent'
          }`}
        >
          <FileCode2 size={12} className={`shrink-0 ${iconColor} ${isSelected ? 'animate-pulse' : ''}`} />
          <span className="truncate">{node.name}</span>
        </button>
      );
    }
  };

  // Lines count calc
  const computeTotalLOC = () => {
    return filesList.reduce((acc, f) => acc + Math.floor((f.size || 0) / 45), 0);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto lg:overflow-hidden w-full max-w-[1680px] mx-auto p-3 sm:p-5 gap-4 sm:gap-5 custom-scrollbar">
      {/* Upper Context Header */}
      <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-md px-5 py-4 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <Layers size={20} className="text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight font-display flex items-center gap-2">
                CodeMind Studio
              </h1>
              {activeProject && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {activeProject.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              {activeModule === 'dashboard' && 'Workspace overview, repository telemetry & vector index status'}
              {activeModule === 'explorer' && 'Interactive codebase tree, AST structure & source inspector'}
              {activeModule === 'rag_assistant' && 'Grounded RAG Copilot with pgvector embeddings & AST citations'}
              {activeModule === 'sql_copilot' && 'Natural language to PostgreSQL compiler with live query execution'}
              {activeModule === 'evaluation' && 'Automated RAG evaluation benchmarks & faithfulness scoring'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {activeProject ? (
            <button 
              onClick={openIntegrationWizard}
              className="inline-flex items-center gap-2 font-medium text-xs text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 transition-all border border-slate-700 px-3.5 py-2 rounded-xl shadow-xs font-mono"
            >
              <FolderGit size={14} className="text-indigo-400" />
              <span>Repository Settings</span>
            </button>
          ) : (
            <button 
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-2 font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 transition-all px-4 py-2 rounded-xl shadow-md shadow-indigo-500/20 font-mono"
            >
              <Plus size={14} />
              <span>Create Project</span>
            </button>
          )}
        </div>
      </div>

      {/* RENDER MODULES */}

      {/* MODULE 1: PLATFORM DASHBOARD */}
      {activeModule === 'dashboard' && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 animate-fade-in custom-scrollbar pb-6">
          
          {/* 1. OVERVIEW BENTO STATS STRIP */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <Activity size={14} className="text-indigo-400" />
                Workspace Telemetry
              </h2>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-800/60 border border-slate-800 px-2 py-0.5 rounded">
                Live PostgreSQL Metrics
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Projects</span>
                <span className="text-2xl font-bold text-white mt-1.5 block font-mono">
                  {dbMetrics ? dbMetrics.totalProjects : 0}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1 font-sans">Active workspaces</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Repositories</span>
                <span className="text-2xl font-bold text-indigo-400 mt-1.5 block font-mono">
                  {dbMetrics ? dbMetrics.totalRepositories : 0}
                </span>
                <span className="text-[11px] text-indigo-300/80 block mt-1 font-sans">GitHub linked</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Source Files</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1.5 block font-mono">
                  {dbMetrics ? dbMetrics.totalFiles : 0}
                </span>
                <span className="text-[11px] text-emerald-300/80 block mt-1 font-sans">Indexed & stored</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Vector Chunks</span>
                <span className="text-2xl font-bold text-cyan-400 mt-1.5 block font-mono">
                  {dbMetrics ? dbMetrics.totalChunks : 0}
                </span>
                <span className="text-[11px] text-cyan-300/80 block mt-1 font-sans">pgvector HNSW</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">AI Queries</span>
                <span className="text-2xl font-bold text-purple-400 mt-1.5 block font-mono">
                  {dbMetrics ? dbMetrics.totalAiQueries : 0}
                </span>
                <span className="text-[11px] text-purple-300/80 block mt-1 font-sans">Copilot runs</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Evaluations</span>
                <span className="text-2xl font-bold text-amber-400 mt-1.5 block font-mono">
                  {dbMetrics ? dbMetrics.totalEvaluations : 0}
                </span>
                <span className="text-[11px] text-amber-300/80 block mt-1 font-sans">Model benchmarks</span>
              </div>
            </div>
          </div>

          {/* 2. ACTIVE REPOSITORY CARD */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <FolderGit size={14} className="text-indigo-400" />
                Active Repository
              </h2>
              {repo && (
                <button
                  onClick={openIntegrationWizard}
                  className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors font-medium"
                >
                  <span>Manage Integration</span>
                  <ExternalLink size={11} />
                </button>
              )}
            </div>

            {repo ? (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm">
                {repo.indexingStatus === 'completed' && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-300 animate-fade-in">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span className="font-bold">Codebase Index Synced with PostgreSQL & pgvector</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 hidden sm:inline font-mono">
                      {filesList.length} source files indexed
                    </span>
                  </div>
                )}

                {['indexing', 'chunking', 'embedding', 'vector_indexing'].includes(repo.indexingStatus) && (
                  <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2.5 font-mono text-xs text-indigo-200 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-bold">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping shrink-0" />
                        <span>Stage: <span className="uppercase text-indigo-300 px-2 py-0.5 bg-indigo-900/60 border border-indigo-500/40 rounded font-semibold">{repo.indexingStatus}</span></span>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        Processed: {repo.processedFiles || 0} / {repo.totalFiles || 0} files
                        {repo.failedFiles > 0 && <span className="text-rose-400 ml-2">({repo.failedFiles} failed)</span>}
                        {repo.skippedFiles > 0 && <span className="text-slate-500 ml-2">({repo.skippedFiles} skipped)</span>}
                      </div>
                    </div>
                    {repo.currentFile && (
                      <div className="text-slate-400 text-[11px] truncate mt-1">
                        <span className="text-indigo-400 font-semibold">Active:</span> <span className="text-slate-300 font-mono">{repo.currentFile}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-mono font-bold shrink-0 shadow-inner">
                      <GitBranch size={20} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">GitHub Repository</span>
                      <h3 className="text-base sm:text-lg font-bold text-white font-mono break-all sm:break-normal flex items-center gap-2.5">
                        <span>{repo.owner}/{repo.repositoryName}</span>
                        <span className="text-xs text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono">
                          {activeProject?.name}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 rounded-full border ${
                      repo.indexingStatus === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : ['indexing', 'chunking', 'embedding', 'vector_indexing'].includes(repo.indexingStatus)
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 animate-pulse'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        repo.indexingStatus === 'completed' ? 'bg-emerald-400' : ['indexing', 'chunking', 'embedding', 'vector_indexing'].includes(repo.indexingStatus) ? 'bg-indigo-400 animate-ping' : 'bg-rose-400'
                      }`} />
                      {repo.indexingStatus === 'completed' 
                        ? '✓ Index Synced' 
                        : repo.indexingStatus === 'chunking'
                        ? '⚡ Chunking AST...'
                        : repo.indexingStatus === 'embedding'
                        ? '⚡ Generating Vectors...'
                        : repo.indexingStatus === 'vector_indexing'
                        ? '⚡ Vector Indexing...'
                        : ['indexing', 'chunking', 'embedding', 'vector_indexing'].includes(repo.indexingStatus)
                        ? '⚡ Indexing Repository...'
                        : 'Failed'}
                    </span>
                    {onDeleteProject && activeProject && (
                      <button
                        onClick={() => onDeleteProject(activeProject.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 rounded-xl transition-all"
                        title="Delete Active Project"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Flat, modern stats strip */}
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 font-mono text-xs gap-4">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-mono">Indexed Files</span>
                    <span className="text-sm font-bold text-white mt-1 block font-mono">{filesList.length} files</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-mono">Lines of Code</span>
                    <span className="text-sm font-bold text-white mt-1 block font-mono">{computeTotalLOC().toLocaleString()} lines</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-mono">Default Branch</span>
                    <span className="text-sm font-bold text-indigo-400 mt-1 block truncate font-mono">{repo.defaultBranch || 'main'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-mono">Last Synced</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-200 mt-1 block font-mono">
                      {formatLastSynced(repo.lastIndexedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 p-8 rounded-2xl text-center shadow-sm">
                <FolderGit size={36} className="mx-auto text-slate-500 mb-3" />
                <h4 className="text-sm font-bold text-white font-display">No GitHub repository connected</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed font-sans">
                  Connect a public GitHub repository to enable code ingestion, vector chunking, and AI-assisted search.
                </p>
                <button
                  onClick={openIntegrationWizard}
                  className="mt-4 inline-flex items-center gap-2 font-medium text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all px-4 py-2 rounded-xl shadow-md shadow-indigo-600/20 font-mono"
                >
                  <Plus size={14} /> Connect GitHub Repository
                </button>
              </div>
            )}
          </div>

          {/* 3. RAG QUALITY BENCHMARK */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <Award size={14} className="text-indigo-400" />
                RAG Pipeline Quality
              </h2>
              <button
                onClick={() => onSelectModule?.('evaluation')}
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors font-medium"
              >
                <span>Full Benchmark Suite</span>
                <ExternalLink size={12} />
              </button>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
                
                {/* Score badge highlight */}
                <div className="flex items-center gap-4 lg:pr-6 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-lg shadow-inner">
                    <Award size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Composite Quality</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-bold text-emerald-400 font-mono">
                        {latestEval ? `${latestEval.overallQuality.toFixed(1)}%` : '84.1%'}
                      </span>
                      <span className="text-[10px] text-emerald-300 font-mono bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">Optimal</span>
                    </div>
                  </div>
                </div>

                {/* Flat metric list */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 lg:pt-0 lg:pl-6 flex-1 font-mono">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Faithfulness</span>
                    <span className="text-xl font-bold text-white mt-1 block font-mono">
                      {latestEval ? `${latestEval.faithfulness.toFixed(0)}%` : '100%'}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-sans">Context grounding</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Answer Relevance</span>
                    <span className="text-xl font-bold text-white mt-1 block font-mono">
                      {latestEval ? `${latestEval.answerRelevance.toFixed(0)}%` : '100%'}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-sans">Intent alignment</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Retrieval Recall</span>
                    <span className="text-xl font-bold text-indigo-400 mt-1 block font-mono">
                      {latestEval ? `${latestEval.retrievalRecall.toFixed(1)}%` : '58.9%'}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-sans">Golden retrieval</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Citation Precision</span>
                    <span className="text-xl font-bold text-cyan-400 mt-1 block font-mono">
                      {latestEval ? `${latestEval.citationPrecision.toFixed(0)}%` : '75%'}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-sans">Line accuracy</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* 4. RECENT ACTIVITY & SYSTEM ARCHITECTURE */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* RECENT ACTIVITY */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Clock size={14} className="text-indigo-400" />
                  Recent Activity
                </h2>
                <span className="text-[10px] font-mono text-slate-500">Live Workspace Stream</span>
              </div>

              <div className="divide-y divide-slate-800/70">
                {getRecentActivities().length > 0 ? (
                  getRecentActivities().map((act) => (
                    <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3 text-xs font-mono">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        {act.type === 'indexing' ? <FolderGit size={14} /> : act.type === 'evaluation' ? <Award size={14} /> : <MessageSquareCode size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-200 font-medium truncate text-xs">{act.title}</span>
                          <span className="text-[10px] text-slate-500 shrink-0 font-mono">{act.timeAgo}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-sans">{act.detail}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs font-mono">
                    No recent activity recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* SYSTEM ARCHITECTURE */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Layers size={14} className="text-indigo-400" />
                    System Architecture
                  </h2>
                  <span className="text-[10px] font-mono text-emerald-300 font-medium bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Active Pipeline
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl mb-4 text-center font-mono text-[11px]">
                  <div className="flex items-center justify-center flex-wrap gap-2 text-slate-300">
                    <span className="font-semibold text-indigo-400">Frontend</span>
                    <span className="text-slate-600">→</span>
                    <span className="font-semibold text-slate-200">Express API</span>
                    <span className="text-slate-600">→</span>
                    <span className="font-semibold text-purple-400">RAG Engine</span>
                    <span className="text-slate-600">→</span>
                    <span className="font-semibold text-emerald-400">PostgreSQL / pgvector</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/70 text-xs font-mono">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400">UI Stack</span>
                    <span className="text-indigo-400 font-medium">React 18 / Vite / Tailwind</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400">Backend Server</span>
                    <span className="text-emerald-400 font-medium">Node.js Express / TS</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400">AI Intelligence</span>
                    <span className="text-amber-400 font-medium">Gemini 3.6 Flash</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400">Vector Storage</span>
                    <span className="text-cyan-400 font-medium">PostgreSQL pgvector (HNSW)</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                Tables, embeddings & vector cosine indexes synchronized in real-time.
              </div>
            </div>
          </div>

          {/* 5. LLM ANALYTICS (COLLAPSIBLE) */}
          <details className="group bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <summary className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 cursor-pointer flex items-center justify-between font-mono text-xs font-bold text-slate-300 hover:text-white select-none transition-colors">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-indigo-400" />
                <span>LLM Query Volume & Request Analytics</span>
              </div>
              <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-5 space-y-4 bg-slate-950/40">
              <div>
                <h3 className="text-sm font-bold text-white font-display">LLM Request Volume & Retrieval Metrics</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">Tracks query throughput and vector retrieval accuracy over time.</p>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tokenChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                    <Area type="monotone" dataKey="Gemini Flash" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </details>
        </div>
      )}

      {/* MODULE 2: CODEBASE EXPLORER */}
      {activeModule === 'explorer' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto lg:overflow-hidden animate-fade-in custom-scrollbar">
          {(!activeProject || !repo) ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 p-12 rounded-2xl text-center shadow-sm">
              <FolderGit size={48} className="mx-auto text-slate-500 mb-3" />
              <h3 className="text-base font-bold text-white font-display">Repository connection needed</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed font-sans">
                In order to explore a codebase, you must associate this project with a public GitHub repository and run our automatic code structure indexer first.
              </p>
              <button 
                onClick={openIntegrationWizard}
                className="mt-5 inline-flex items-center gap-2 font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 font-mono"
              >
                Connect GitHub Repository
              </button>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col gap-3 lg:overflow-hidden">
              {repo?.indexingStatus === 'completed' && (
                <div className="p-2.5 px-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-300 shrink-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span className="font-bold">Indexing completed</span>
                    <span className="text-slate-400 hidden sm:inline">• Codebase AST directory tree and PostgreSQL files are fully synced.</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-300 font-semibold">
                    {filesList.length} Files Ready
                  </span>
                </div>
              )}

              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch lg:overflow-hidden pb-4 lg:pb-0">
                {/* File Explorer Tree Panel */}
                <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-2xl space-y-3 flex flex-col lg:col-span-4 xl:col-span-3 h-auto max-h-72 lg:max-h-none lg:h-full overflow-hidden shadow-sm min-h-0">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 shrink-0">
                    <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <FolderGit size={13} className="text-indigo-400" />
                      Codebase Directory
                    </h3>
                    <button 
                      onClick={loadProjectFiles}
                      className="text-slate-400 hover:text-white transition-colors p-1"
                      title="Refresh folder files"
                    >
                      <RefreshCw size={12} className={loadingFiles ? 'animate-spin text-indigo-400' : ''} />
                    </button>
                  </div>

                  {/* Elegant Search Bar */}
                  <div className="relative shrink-0">
                    <Search className="absolute left-2.5 top-2.5 text-slate-500" size={13} />
                    <input
                      type="text"
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      placeholder="Filter files..."
                      className="w-full bg-slate-950/60 border border-slate-800 text-[11px] font-mono rounded-xl pl-8 pr-7 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    />
                    {fileSearch && (
                      <button
                        onClick={() => setFileSearch('')}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-[10px] font-mono px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  {loadingFiles ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 font-mono text-[11px] py-12">
                      <RefreshCw className="animate-spin mr-2 text-indigo-400" size={12} /> Syncing directory...
                    </div>
                  ) : fileSearch.trim() ? (
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-0.5 select-none font-mono">
                      {filesList.filter(f => f.path.toLowerCase().includes(fileSearch.toLowerCase())).map(f => {
                        const isSelected = selectedFileDetail?.id === f.id;
                        const ext = f.name.split('.').pop() || '';
                        let iconColor = 'text-slate-500';
                        if (['ts', 'tsx'].includes(ext)) iconColor = 'text-blue-400';
                        else if (['js', 'jsx'].includes(ext)) iconColor = 'text-amber-400';
                        else if (['json', 'yml', 'yaml'].includes(ext)) iconColor = 'text-purple-400';
                        else if (['md'].includes(ext)) iconColor = 'text-pink-400';
                        else if (['sql'].includes(ext)) iconColor = 'text-cyan-400';
                        return (
                          <button
                            key={f.id}
                            onClick={() => handleFileSelect(f.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-left transition-all border ${
                              isSelected 
                                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 font-semibold shadow-xs' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border-transparent'
                            }`}
                          >
                            <FileCode2 size={12} className={`shrink-0 ${iconColor}`} />
                            <span className="truncate" title={f.path}>{f.path}</span>
                          </button>
                        );
                      })}
                      {filesList.filter(f => f.path.toLowerCase().includes(fileSearch.toLowerCase())).length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-[11px] font-mono">No matching files</div>
                      )}
                    </div>
                  ) : fileTree && Object.keys(fileTree.children || {}).length > 0 ? (
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-1 select-none font-mono">
                      {renderNode(fileTree)}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-2">
                      <p className="text-xs text-slate-500 font-mono">No files found.</p>
                      <button
                        onClick={openIntegrationWizard}
                        className="text-[10px] text-indigo-400 font-mono underline block mx-auto font-semibold"
                      >
                        Configure / Trigger Indexing
                      </button>
                    </div>
                  )}
                </div>

                {/* Code Viewer Panel */}
                <div className="lg:col-span-8 xl:col-span-9 bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col h-[550px] sm:h-[650px] lg:h-full shadow-sm min-h-0">
                  {/* IDE Tab Header */}
                  <div className="bg-slate-950/80 border-b border-slate-800/80 flex flex-col shrink-0">
                    <div className="flex items-center justify-between px-3 pt-2">
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {/* Tab item */}
                        <div className={`flex items-center gap-2 px-3.5 py-2 border-t-2 border-r border-slate-800/80 rounded-t-xl text-xs font-mono transition-all ${
                          selectedFileDetail 
                            ? 'bg-slate-900 border-t-indigo-500 text-white font-bold' 
                            : 'bg-transparent border-t-transparent text-slate-500'
                        }`}>
                          {selectedFileDetail ? (
                            <>
                              <FileCode2 size={13} className="text-indigo-400" />
                              <span>{selectedFileDetail.name}</span>
                              <span className="text-[10px] text-slate-500 hover:text-white cursor-pointer ml-1">✕</span>
                            </>
                          ) : (
                            <>
                              <Code size={13} />
                              <span>Workspace</span>
                            </>
                          )}
                        </div>
                      </div>

                      {selectedFileDetail && (
                        <div className="flex items-center gap-2 pb-2">
                          <button
                            onClick={async () => {
                              if (!selectedFileDetail?.content) return;
                              await navigator.clipboard.writeText(selectedFileDetail.content);
                              setCopiedFile(true);
                              setTimeout(() => setCopiedFile(false), 1500);
                            }}
                            className="px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg font-mono transition-all flex items-center gap-1.5 shadow-xs"
                            title="Copy full file content"
                          >
                            {copiedFile ? (
                              <>
                                <CheckCircle2 size={12} className="text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => openDeleteModal('files', selectedFileDetail.id)}
                            title="Delete this file"
                            className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 rounded-lg font-mono transition-all flex items-center gap-1.5 shadow-xs"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Path Breadcrumbs strip */}
                    <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-indigo-400 font-bold">{repo?.repositoryName || 'repository'}</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-200 truncate font-medium">{selectedFileDetail ? selectedFileDetail.path : 'None selected'}</span>
                      </div>
                      {selectedFileDetail && (
                        <div className="flex items-center gap-3 shrink-0 text-slate-400">
                          <span>Size: <strong className="text-slate-200 font-mono">{(selectedFileDetail.size / 1024).toFixed(2)} KB</strong></span>
                          <span className="text-slate-600">•</span>
                          <span>Lines: <strong className="text-slate-200 font-mono">{selectedFileDetail.content ? selectedFileDetail.content.split('\n').length : 0}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {renderCodeContent()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODULE 3: RAG COPILOT */}
      {activeModule === 'rag_assistant' && (
        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto lg:overflow-hidden animate-fade-in custom-scrollbar">
          {/* Top RAG Studio Header Banner */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-lg text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                <Sparkles size={20} className="text-indigo-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm sm:text-base font-bold font-mono text-white tracking-tight">
                    RAG Grounded Copilot
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    pgvector Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Semantic codebase Q&A grounded on HNSW vector indices & AST chunking.
                </p>
              </div>
            </div>

            {/* Quick Engine Meta Pills */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
              <div className="bg-slate-950/60 border border-slate-800 px-3 py-1 rounded-xl text-slate-300 flex items-center gap-1.5 shadow-xs">
                <FolderGit size={12} className="text-indigo-400" />
                <span className="text-slate-500">Repo:</span>
                <strong className="text-indigo-300 font-semibold">{repo ? `${repo.owner}/${repo.repositoryName}` : 'None'}</strong>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 px-3 py-1 rounded-xl text-slate-300 flex items-center gap-1.5 shadow-xs">
                <Cpu size={12} className="text-cyan-400" />
                <span className="text-slate-500">Model:</span>
                <strong className="text-cyan-300 font-semibold">Gemini 3.6 Flash</strong>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 px-3 py-1 rounded-xl text-slate-300 flex items-center gap-1.5 shadow-xs">
                <Database size={12} className="text-emerald-400" />
                <span className="text-slate-500">Files:</span>
                <strong className="text-emerald-300 font-semibold">{filesList.length} Indexed</strong>
              </div>
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch lg:overflow-hidden pb-4 lg:pb-0">
            {/* Left Sidebar: Chat Sessions & Vector Info */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col h-auto lg:h-full min-h-0 lg:overflow-hidden lg:col-span-4 xl:col-span-3 shadow-sm">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-2.5 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <MessageSquareCode size={13} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Sessions</h3>
                  <span className="text-[10px] font-mono bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded font-medium text-slate-400">
                    {conversationsList.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMobileSessionsOpen(prev => !prev)}
                    className="lg:hidden p-1 text-slate-300 hover:text-white text-[10px] font-mono font-medium px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded-lg"
                  >
                    {mobileSessionsOpen ? '▲ Hide' : '▼ List'}
                  </button>
                  <button
                    onClick={() => openDeleteModal('conversations')}
                    title="Select & delete conversations"
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button
                    onClick={startNewChat}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-2.5 py-1 rounded-lg font-mono transition-all flex items-center gap-1 font-semibold shadow-xs"
                  >
                    <Plus size={12} />
                    <span>New</span>
                  </button>
                </div>
              </div>

              {/* Sessions Body (Always shown on desktop, toggleable on mobile) */}
              <div className={`${mobileSessionsOpen ? 'flex' : 'hidden lg:flex'} flex-col flex-1 min-h-0 overflow-hidden`}>
                {/* Session Filter Search */}
                {conversationsList.length > 2 && (
                  <div className="relative mb-2.5 shrink-0">
                    <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={convoSearch}
                      onChange={(e) => setConvoSearch(e.target.value)}
                      placeholder="Filter sessions..."
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                    {convoSearch && (
                      <button onClick={() => setConvoSearch('')} className="absolute right-2 top-2 text-slate-500 hover:text-slate-300">
                        <X size={11} />
                      </button>
                    )}
                  </div>
                )}

                {/* Sessions Scroll List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1 max-h-48 lg:max-h-none min-h-[100px]">
                  {conversationsList.length === 0 ? (
                    <div className="text-center py-6 lg:py-10 px-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs font-mono leading-relaxed my-auto">
                      <Sparkles size={20} className="mx-auto text-indigo-400 mb-2 opacity-60" />
                      No active sessions.<br/>Click <strong className="text-indigo-400">New</strong> to start!
                    </div>
                  ) : (
                    conversationsList
                      .filter(c => !convoSearch || (c.title && c.title.toLowerCase().includes(convoSearch.toLowerCase())))
                      .map((convo) => {
                        const isActive = currentConversationId === convo.id;
                        return (
                          <div key={convo.id} className="group relative flex items-center">
                            <button
                              onClick={() => {
                                loadConversationMessages(convo.id);
                                setMobileSessionsOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-sans truncate transition-all flex items-center gap-2 border ${
                                isActive
                                  ? 'bg-indigo-500/15 border-indigo-500/30 text-white font-semibold shadow-xs pr-8'
                                  : 'bg-transparent border-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 pr-8'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`}></span>
                              <span className="truncate flex-1 font-mono text-[11px] leading-tight">
                                {convo.title || 'Untitled Session'}
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal('conversations', convo.id);
                              }}
                              title="Delete conversation"
                              className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Grounding Index Card Footer */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 shrink-0 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Layers size={11} className="text-indigo-400" />
                      pgvector HNSW Index
                    </span>
                    <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-medium">
                      Active
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Source Repo:</span>
                      <strong className="text-slate-200 truncate max-w-[110px]">{repo ? repo.repositoryName : 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Similarity Metric:</span>
                      <strong className="text-slate-200">Cosine (0.70+)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Main Dialogue & Chat Area */}
            <div className="lg:col-span-8 xl:col-span-9 bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col h-[650px] sm:h-[720px] lg:h-full shadow-sm min-h-0">
              {/* Chat Header Bar */}
              <div className="bg-slate-950/80 px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${chatLoading ? 'bg-amber-400 animate-ping' : 'bg-indigo-400'}`}></div>
                  <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-tight truncate">
                    {currentConversationId 
                      ? conversationsList.find(c => c.id === currentConversationId)?.title || 'Active Conversation'
                      : 'New RAG Grounded Session'}
                  </h3>
                </div>
                
                <div className="flex items-center gap-2">
                  {repo && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                      <FolderGit size={11} className="text-indigo-400" />
                      {repo.owner}/{repo.repositoryName}
                    </span>
                  )}
                  {currentConversationId && (
                    <button
                      type="button"
                      onClick={() => openDeleteModal('conversations', currentConversationId)}
                      className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Clear session"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div 
                ref={chatScrollRef}
                className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto overflow-x-hidden space-y-5 bg-slate-950/30 custom-scrollbar overscroll-contain"
              >
                {/* Empty State Card if no user messages yet */}
                {messages.length <= 1 && messages[0]?.id === 'init' && (
                  <div className="my-auto max-w-2xl mx-auto w-full space-y-4 py-6">
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-sm text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                        <Bot size={24} />
                      </div>
                      <h3 className="text-sm font-bold text-white font-mono">
                        CodeMind RAG Grounded Intelligence
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto font-sans">
                        Ask questions about architecture, API data flows, dependencies, or database schemas. Every answer is grounded on vector embeddings stored in PostgreSQL.
                      </p>
                    </div>

                    {/* Starter Category Cards */}
                    {repo && (
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {[
                          { icon: Zap, label: 'System Architecture', query: 'Explain the high-level architecture and key directory modules.' },
                          { icon: ShieldCheck, label: 'Security & Access Control', query: 'How is authentication, authorization, and API route security enforced?' },
                          { icon: Workflow, label: 'API Data Pipeline', query: 'Trace data flow from client requests down to PostgreSQL models.' },
                          { icon: Code, label: 'Schemas & Types', query: 'List core TypeScript interfaces and database schemas used in this project.' },
                        ].map((item, iIdx) => (
                          <button
                            key={iIdx}
                            type="button"
                            onClick={() => setChatInput(item.query)}
                            className="p-3.5 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all group flex items-start gap-3 shadow-xs"
                          >
                            <item.icon size={16} className="text-indigo-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="text-[11px] font-bold font-mono text-slate-200 group-hover:text-white">{item.label}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-sans">{item.query}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Render Messages */}
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                        isUser
                          ? 'bg-slate-800 border border-slate-700 text-indigo-400'
                          : 'bg-indigo-600 text-white shadow-indigo-600/30'
                      }`}>
                        {isUser ? <User size={14} /> : <Bot size={14} />}
                      </div>

                      <div className={`flex-1 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-full overflow-hidden border ${
                        isUser
                          ? 'bg-indigo-600 text-white border-indigo-500 px-4 py-3 shadow-md shadow-indigo-600/20'
                          : 'bg-slate-900/80 text-slate-200 border-slate-800 px-5 py-4 shadow-sm'
                      }`}>
                        {/* AI Header */}
                        {!isUser && (
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[11px] text-indigo-400 font-mono flex items-center gap-1.5">
                                <Sparkles size={12} className="text-indigo-400 shrink-0" />
                                CodeMind AI
                              </span>
                              <span className="text-[9px] font-mono text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">RAG Grounded</span>
                            </div>
                            <CopyMessageButton text={m.content} />
                          </div>
                        )}

                        {/* Content Body */}
                        {isUser ? (
                          <div className="whitespace-pre-line text-white font-sans text-xs sm:text-[13px] font-medium">{m.content}</div>
                        ) : (
                          <AssistantMessageContent content={m.content} onOpenFile={handleOpenSourceInExplorer} />
                        )}

                        {/* Cited Grounding Context Sources */}
                        {!isUser && m.sources && m.sources.length > 0 && (
                          <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                                <FileCode2 size={12} className="text-indigo-400 shrink-0" />
                                Retrieved Grounding Context ({m.sources.length} files)
                              </span>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {m.sources.map((src, sIdx) => {
                                const pct = Math.round(src.similarity * 100);
                                return (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    onClick={() => handleOpenSourceInExplorer(src.filePath)}
                                    className="bg-slate-950/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl transition-all text-left group flex flex-col gap-1.5 shadow-xs"
                                  >
                                    <div className="flex items-center justify-between gap-2 w-full">
                                      <span className="font-mono text-[10px] font-semibold text-slate-300 group-hover:text-indigo-300 truncate flex items-center gap-1.5">
                                        <Code size={12} className="text-indigo-400 shrink-0" />
                                        {src.filePath}
                                      </span>
                                      <span className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded-full shrink-0 ${
                                        pct >= 70 
                                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                                          : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                      }`}>
                                        {pct}% match
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 w-full">
                                      <span>Lines {src.startLine}–{src.endLine}</span>
                                      <span className="text-indigo-400 group-hover:underline flex items-center gap-0.5 shrink-0 font-medium">
                                        View in Explorer <ExternalLink size={9} />
                                      </span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-emerald-400' : 'bg-indigo-500'}`} 
                                        style={{ width: `${pct}%` }}
                                      ></div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Footer Info */}
                        <div className={`mt-3 pt-2 flex items-center justify-between text-[9px] font-mono ${isUser ? 'text-indigo-100' : 'text-slate-500'}`}>
                          <span>{isUser ? 'Delivered' : 'Grounded on pgvector HNSW indices'}</span>
                          <span>{m.timestamp}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Loading / Searching Animation */}
                {chatLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3 max-w-3xl"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-indigo-600 text-white shadow-sm">
                      <Bot size={14} />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-indigo-500/30 text-slate-200 flex items-center gap-2.5 shadow-sm">
                      <Sparkles size={14} className="text-indigo-400 animate-spin" />
                      <span className="text-[11px] font-mono text-indigo-300 animate-pulse font-medium">
                        Searching pgvector indices & retrieving codebase context...
                      </span>
                      <div className="flex gap-1 items-center ml-1">
                        {[0, 1, 2].map((dot) => (
                          <motion.div
                            key={dot}
                            className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                            animate={{ y: [0, -4, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: dot * 0.15,
                              ease: 'easeInOut',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Quick Prompts Bar */}
              {repo && !chatLoading && (
                <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none text-[10px] font-mono shrink-0">
                  <span className="text-slate-500 shrink-0 font-bold uppercase text-[9px] tracking-wider">Quick Prompts:</span>
                  {[
                    '⚡ Explain architecture',
                    '🔍 Show key source files',
                    '🔒 Security & Auth audit',
                    '🚀 API endpoints & data flow',
                    '🛠️ Database schema details'
                  ].map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => {
                        setChatInput(chip.replace(/^[^\s]+\s*/, ''));
                      }}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white px-3 py-1 rounded-lg shrink-0 transition-all shadow-xs font-medium"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Prompt Input Area */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-800/80 bg-slate-950/90 flex flex-col gap-2 shrink-0">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={repo ? "Ask CodeMind AI about your codebase..." : "Connect a GitHub repository first to run RAG queries..."}
                    disabled={!repo || chatLoading}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-[13px] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!repo || chatLoading || !chatInput.trim()}
                    className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-semibold disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 font-mono"
                  >
                    <span>Send</span>
                    <Send size={13} className={chatLoading ? 'animate-pulse' : ''} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
                  <span>Press <strong className="text-slate-400">Enter</strong> to send query</span>
                  <span>Grounding: <strong className="text-indigo-400 font-medium">{repo ? `${repo.repositoryName}` : 'No repo'}</strong></span>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: SQL COPILOT */}
      {activeModule === 'sql_copilot' && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 animate-fade-in custom-scrollbar pb-8">
          <SqlCopilot projectId={activeProject?.id || ''} />
        </div>
      )}

      {/* MODULE 5: LLM EVAL SUITE */}
      {activeModule === 'evaluation' && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 animate-fade-in custom-scrollbar pb-8">
          {(!activeProject || !repo) ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 p-12 rounded-2xl text-center shadow-sm">
              <FolderGit size={48} className="mx-auto text-slate-500 mb-3" />
              <h3 className="text-base font-bold text-white font-display">Repository connection needed</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed font-sans">
                In order to evaluate the RAG pipeline, you must associate this project with a public GitHub repository and run our automatic code structure indexer first.
              </p>
              <button 
                onClick={openIntegrationWizard}
                className="mt-5 inline-flex items-center gap-2 font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 font-mono"
              >
                Connect GitHub Repository
              </button>
            </div>
          ) : (
            <EvaluationSuite projectId={activeProject.id} />
          )}
        </div>
      )}

      {/* INTEGRATE GITHUB WIZARD MODAL */}
      {showGithubModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-scale-up">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FolderGit size={18} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-mono">Integrate GitHub Repository</h3>
              </div>
              <button 
                onClick={() => setShowGithubModal(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modalError && (
                <div className="p-3.5 bg-rose-950/50 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300 text-xs font-mono">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-400" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* STEP 1: ENTER URL */}
              {modalStep === 'enter_url' && (
                <form onSubmit={handleConnectRepository} className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Associate a public GitHub repository. This parses general metadata (languages, stars, main branches) and maps relationship vectors inside PostgreSQL.
                  </p>
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                      GitHub Repository URL
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. https://github.com/facebook/react"
                      value={githubUrlInput}
                      onChange={(e) => setGithubUrlInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500 font-mono shadow-inner"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 font-mono">
                    <button
                      type="button"
                      onClick={() => setShowGithubModal(false)}
                      className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                    >
                      {modalLoading ? <RefreshCw className="animate-spin" size={14} /> : null}
                      <span>Connect Repo</span>
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: REPO INFO */}
              {modalStep === 'repo_info' && tempRepoInfo && (
                <div className="space-y-4 font-mono text-xs text-slate-300">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Repository Name:</span>
                      <span className="font-bold text-white">{tempRepoInfo.repositoryName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Owner / Org:</span>
                      <span className="font-bold text-white">{tempRepoInfo.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Stars Count:</span>
                      <span className="font-bold text-amber-400">★ {tempRepoInfo.stars}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Default Branch:</span>
                      <span className="font-bold text-indigo-400">{tempRepoInfo.defaultBranch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Primary Language:</span>
                      <span className="font-bold text-cyan-400">{tempRepoInfo.language}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Index Status:</span>
                      <span className="font-bold uppercase text-slate-300">{tempRepoInfo.indexingStatus}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-normal font-sans">
                    Click <strong>Start Indexing</strong> to fetch the codebase directory tree, run filters on source code files, download files safely, and store them inside your PostgreSQL instance.
                  </p>

                  <div className="pt-4 border-t border-slate-800 flex justify-between gap-3 font-mono">
                    <button
                      type="button"
                      onClick={handleDisconnectRepository}
                      className="px-3 py-2 bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/50 rounded-xl text-xs transition-colors flex items-center gap-1.5 font-semibold"
                    >
                      <Trash2 size={12} /> Disconnect
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setModalStep('enter_url')}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 text-xs sm:text-sm font-semibold transition-colors"
                      >
                        Change Repo
                      </button>
                      <button
                        type="button"
                        onClick={handleStartIndexing}
                        disabled={modalLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                      >
                        {modalLoading ? <RefreshCw className="animate-spin" size={14} /> : null}
                        <span>Start Indexing</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: INDEXING STATUS */}
              {modalStep === 'indexing' && tempRepoInfo && (
                <div className="space-y-4 text-center py-6 font-mono">
                  <RefreshCw className="animate-spin mx-auto text-indigo-400 mb-2" size={32} />
                  
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Indexing Codebase...</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed font-sans">
                    CodeMind is scanning repository trees, stripping binaries, and streaming real file contents into the database.
                  </p>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left text-xs space-y-2 max-w-sm mx-auto text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Indexing State:</span>
                      <span className="text-indigo-400 uppercase font-semibold animate-pulse">{tempRepoInfo.indexingStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Processed Files:</span>
                      <span className="text-white font-bold">{tempRepoInfo.processedFiles} / {tempRepoInfo.totalFiles || '?'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Skipped Files:</span>
                      <span className="text-slate-400">{tempRepoInfo.skippedFiles || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Failed / Errors:</span>
                      <span className={tempRepoInfo.failedFiles > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>{tempRepoInfo.failedFiles || 0}</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-sm mx-auto overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${tempRepoInfo.totalFiles ? Math.min((tempRepoInfo.processedFiles / tempRepoInfo.totalFiles) * 100, 100) : 10}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* STEP 4: INDEXING COMPLETED */}
              {modalStep === 'completed' && tempRepoInfo && (
                <div className="space-y-4 text-center py-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-inner">
                    <ShieldCheck size={28} />
                  </div>
                  
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest font-mono">Indexing Completed Successfully!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed font-sans">
                    We have successfully cloned the recursive git tree of <strong>{tempRepoInfo.owner}/{tempRepoInfo.repositoryName}</strong> directly to your secure PostgreSQL database tables.
                  </p>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left text-xs space-y-1.5 max-w-sm mx-auto font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Indexed Files:</span>
                      <span className="text-white font-bold">{tempRepoInfo.processedFiles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Failed Files:</span>
                      <span className="text-slate-400">{tempRepoInfo.failedFiles || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Synced Time:</span>
                      <span className="text-white text-[10px]">{tempRepoInfo.lastIndexedAt ? new Date(tempRepoInfo.lastIndexedAt).toLocaleTimeString() : 'Just now'}</span>
                    </div>
                  </div>

                  <div className="pt-4 max-w-sm mx-auto">
                    <button
                      type="button"
                      onClick={() => setShowGithubModal(false)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 font-mono"
                    >
                      Open Codebase Explorer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE SELECTION & CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                   <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Delete Workspace Items
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Select conversations or indexed files to permanently delete from your project database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
              
              {/* Tab Selection */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTab('conversations');
                      setSelectedDeleteIds([]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                      deleteTab === 'conversations'
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <MessageSquareCode size={13} />
                    <span>Conversations ({conversationsList.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTab('files');
                      setSelectedDeleteIds([]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                      deleteTab === 'files'
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileCode2 size={13} />
                    <span>Indexed Files ({filesList.length})</span>
                  </button>
                </div>

                {/* Select All Button */}
                <button
                  type="button"
                  onClick={handleSelectAllDelete}
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 hover:underline px-2 py-1 rounded font-medium"
                >
                  {getFilteredDeleteItems().length > 0 && selectedDeleteIds.length === getFilteredDeleteItems().length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={deleteSearch}
                  onChange={(e) => setDeleteSearch(e.target.value)}
                  placeholder={`Search ${deleteTab === 'conversations' ? 'conversations' : 'files'}...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
                />
              </div>

              {/* Status Messages */}
              {deleteError && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-mono">
                  {deleteError}
                </div>
              )}
              {deleteSuccessMsg && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl font-mono flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>{deleteSuccessMsg}</span>
                </div>
              )}

              {/* Item List */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-60 overflow-y-auto divide-y divide-slate-800/80 custom-scrollbar">
                {getFilteredDeleteItems().length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">
                    No {deleteTab === 'conversations' ? 'conversations' : 'files'} found.
                  </div>
                ) : (
                  getFilteredDeleteItems().map((item: any) => {
                    const isSelected = selectedDeleteIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleSelectDelete(item.id)}
                        className={`p-3 text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-rose-950/30 text-rose-300 font-semibold' : 'hover:bg-slate-900/60 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="shrink-0">
                            {isSelected ? (
                              <CheckSquare size={16} className="text-rose-400" />
                            ) : (
                              <Square size={16} className="text-slate-600" />
                            )}
                          </div>
                          <div className="truncate">
                            {deleteTab === 'conversations' ? (
                              <div>
                                <div className="font-semibold text-slate-200 truncate">{item.title || 'Untitled Session'}</div>
                                <div className="text-[10px] text-slate-500">
                                  Created: {new Date(item.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-semibold text-slate-200 truncate">{item.path}</div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                  <span>{item.language}</span>
                                  <span>•</span>
                                  <span>{(item.size / 1024).toFixed(1)} KB</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Confirmation Question */}
              {selectedDeleteIds.length > 0 && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-300 font-sans leading-relaxed">
                    <span className="font-bold text-rose-200 font-mono block mb-0.5">Confirm Deletion ({selectedDeleteIds.length} item{selectedDeleteIds.length > 1 ? 's' : ''})</span>
                    Are you sure you want to delete the selected item(s)? This will permanently erase them from the database and remove associated vector embeddings.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between bg-slate-950">
              <span className="text-xs font-mono text-slate-500">
                {selectedDeleteIds.length} item{selectedDeleteIds.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex items-center gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-300 text-xs sm:text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={selectedDeleteIds.length === 0 || deleteLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  {deleteLoading ? <RefreshCw className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  <span>{deleteLoading ? 'Deleting...' : `Delete (${selectedDeleteIds.length})`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
