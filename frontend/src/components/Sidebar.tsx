import { 
  FolderGit, 
  MessageSquareCode, 
  Database, 
  BarChart3, 
  Compass, 
  LogOut,
  Cpu,
  Plus,
  Trash2,
  GitBranch,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Project } from '../types';

interface SidebarProps {
  user: any;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project) => void;
  onOpenCreateModal: () => void;
  activeModule: string;
  onSelectModule: (module: string) => void;
  onLogout: () => void;
  onDeleteProject: (id: string) => void;
}

export default function Sidebar({
  user,
  projects,
  activeProject,
  onSelectProject,
  onOpenCreateModal,
  activeModule,
  onSelectModule,
  onLogout,
  onDeleteProject
}: SidebarProps) {

  const modules = [
    { id: 'dashboard', label: 'Platform Dashboard', icon: BarChart3, badge: null, desc: 'Analytics & Insights' },
    { id: 'explorer', label: 'Codebase Explorer', icon: FolderGit, badge: 'Git', desc: 'File Tree & AST' },
    { id: 'rag_assistant', label: 'RAG Copilot', icon: MessageSquareCode, badge: 'AI', desc: 'Semantic Code Chat' },
    { id: 'sql_copilot', label: 'SQL Copilot', icon: Database, badge: 'DB', desc: 'Text-to-SQL Analytics' },
    { id: 'evaluation', label: 'LLM Eval Suite', icon: Compass, badge: 'RAG', desc: 'Precision & Benchmarks' },
  ];

  return (
    <aside className="w-68 border-r border-slate-800/80 bg-slate-950 text-slate-100 flex flex-col h-full shrink-0 select-none shadow-xl">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
                <Cpu size={18} className="text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-white text-sm tracking-tight font-display">CodeMind</h1>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 font-bold">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Developer Intelligence</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0">
              {(user?.name || 'D').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate leading-tight">{user?.name || 'Developer'}</p>
              <p className="text-[10px] text-slate-400 truncate font-mono">{user?.email || 'dev@codemind.ai'}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors shrink-0"
            title="Log Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Navigation Modules */}
      <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-5 custom-scrollbar">
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Core Modules
            </span>
          </div>
          <div className="space-y-1">
            {modules.map((m) => {
              const Icon = m.icon;
              const isActive = activeModule === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectModule(m.id)}
                  className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all relative ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-indigo-700/80 text-white' : 'bg-slate-800/80 text-slate-400 group-hover:text-indigo-300 group-hover:bg-slate-800'
                    }`}>
                      <Icon size={15} />
                    </div>
                    <div className="text-left">
                      <span className="block font-medium tracking-tight truncate">{m.label}</span>
                    </div>
                  </div>
                  {m.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase ${
                      isActive 
                        ? 'bg-indigo-900/90 text-indigo-100 border border-indigo-400/30' 
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 group-hover:text-slate-300'
                    }`}>
                      {m.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Project Selector section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Repositories ({projects.length})
            </span>
            <button 
              onClick={onOpenCreateModal}
              className="text-indigo-400 hover:text-indigo-300 px-2 py-0.5 hover:bg-indigo-950/50 border border-indigo-500/20 rounded-md transition-colors flex items-center gap-1 text-[10px] font-mono font-bold"
              title="Add repository"
            >
              <Plus size={11} />
              <span>Import</span>
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="p-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-center">
              <FolderGit size={20} className="mx-auto text-slate-500 mb-1.5 opacity-70" />
              <p className="text-[11px] text-slate-400 mb-2 font-mono">No repositories linked.</p>
              <button
                onClick={onOpenCreateModal}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1 mx-auto"
              >
                <Plus size={12} /> Link GitHub Repo
              </button>
            </div>
          ) : (
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
              {projects.map((p) => {
                const isActive = activeProject?.id === p.id;
                return (
                  <div 
                    key={p.id}
                    className={`group w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                      isActive 
                        ? 'bg-slate-900 text-white font-semibold border border-indigo-500/40 shadow-sm' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/50 border border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => onSelectProject(p)}
                      className="flex-1 flex flex-col text-left overflow-hidden mr-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-indigo-400 ring-2 ring-indigo-400/20' : 'bg-slate-500'}`}></span>
                        <span className="font-semibold truncate block text-slate-200 text-xs">{p.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono pl-3">
                        <GitBranch size={9} className="text-indigo-400 shrink-0" /> {p.activeBranch}
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(p.id);
                      }}
                      className={`p-1 rounded-md transition-all shrink-0 ${
                        isActive
                          ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                          : 'opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                      }`}
                      title={`Delete project "${p.name}"`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950">
        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-indigo-400" />
            <span className="text-slate-400 text-[11px] font-medium">pgvector & pgai</span>
          </div>
          <span className="flex items-center gap-1.5 font-bold text-emerald-400 text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            HEALTHY
          </span>
        </div>
      </div>
    </aside>
  );
}
