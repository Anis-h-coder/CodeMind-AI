import { ReactNode, useState } from 'react';
import { Menu, X, Cpu, GitBranch, Layers, Sparkles } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { Project } from '../types';

interface DashboardLayoutProps {
  user: any;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project) => void;
  onOpenCreateModal: () => void;
  activeModule: string;
  onSelectModule: (module: string) => void;
  onLogout: () => void;
  onDeleteProject: (id: string) => void;
  children: ReactNode;
}

export default function DashboardLayout({
  user,
  projects,
  activeProject,
  onSelectProject,
  onOpenCreateModal,
  activeModule,
  onSelectModule,
  onLogout,
  onDeleteProject,
  children
}: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full shrink-0 shadow-2xl z-20">
        <Sidebar
          user={user}
          projects={projects}
          activeProject={activeProject}
          onSelectProject={onSelectProject}
          onOpenCreateModal={onOpenCreateModal}
          activeModule={activeModule}
          onSelectModule={onSelectModule}
          onLogout={onLogout}
          onDeleteProject={onDeleteProject}
        />
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-72 h-full shadow-2xl">
            <Sidebar
              user={user}
              projects={projects}
              activeProject={activeProject}
              onSelectProject={(p) => {
                onSelectProject(p);
                setMobileSidebarOpen(false);
              }}
              onOpenCreateModal={() => {
                onOpenCreateModal();
                setMobileSidebarOpen(false);
              }}
              activeModule={activeModule}
              onSelectModule={(m) => {
                onSelectModule(m);
                setMobileSidebarOpen(false);
              }}
              onLogout={onLogout}
              onDeleteProject={onDeleteProject}
            />
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-[-44px] p-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 hover:text-white shadow-xl"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#070b14]">
        {/* Mobile top-bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950 shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-1.5 rounded-lg text-white shadow-sm shadow-indigo-500/20">
              <Cpu size={16} />
            </div>
            <div>
              <span className="font-bold text-white text-xs tracking-tight font-display block">CodeMind AI</span>
              {activeProject && (
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px] block">
                  {activeProject.name}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <Menu size={18} />
          </button>
        </header>

        {/* Viewport content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#070b14] relative text-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
