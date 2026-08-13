import { useState, useEffect, FormEvent } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ShieldAlert, Cpu, X, FolderGit, Compass, GitBranch, Terminal } from 'lucide-react';
import Navbar from './components/Navbar';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import { api } from './services/api';
import { User, Project } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal input states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectGithub, setNewProjectGithub] = useState('');
  const [newProjectBranch, setNewProjectBranch] = useState('main');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Initialize and verify authentication state from server
  useEffect(() => {
    const savedUser = localStorage.getItem('codemind_user');
    const token = localStorage.getItem('codemind_token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      // Fetch projects
      fetchProjects();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchProjects() {
    try {
      const data = await api.projects.list();
      setProjects(data);
      if (data.length > 0) {
        setActiveProject(data[0]);
      }
    } catch (err: any) {
      const isAuthErr = err.message && (
        err.message.includes('Token') || 
        err.message.includes('token') || 
        err.message.includes('UNAUTHENTICATED')
      );
      if (isAuthErr) {
        console.warn('Session expired. Redirecting to login.');
        handleLogout();
      } else {
        console.error('Failed to load projects:', err);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLoginSuccess(authenticatedUser: User) {
    setUser(authenticatedUser);
    fetchProjects();
  }

  function handleLogout() {
    api.auth.logout();
    setUser(null);
    setProjects([]);
    setActiveProject(null);
  }

  async function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setCreateError('Project Name is required.');
      return;
    }
    setCreateError('');
    setCreating(true);

    try {
      const p = await api.projects.create({
        name: newProjectName,
        description: newProjectDesc,
        githubUrl: newProjectGithub || undefined,
        activeBranch: newProjectBranch || 'main',
      });
      setProjects(prev => [...prev, p]);
      setActiveProject(p);
      setShowCreateModal(false);
      
      // Clear fields
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectGithub('');
      setNewProjectBranch('main');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteProject(id: string) {
    try {
      await api.projects.delete(id);
      const filtered = projects.filter(p => p.id !== id);
      setProjects(filtered);
      if (activeProject?.id === id) {
        setActiveProject(filtered.length > 0 ? filtered[0] : null);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B12] flex flex-col items-center justify-center text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-blue-600/20 border border-blue-500/30 p-4 rounded-xl text-cyan-400 animate-spin">
            <Cpu size={32} />
          </div>
          <p className="text-sm font-mono text-slate-400">Loading CodeMind AI Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route 
          path="/" 
          element={
            <>
              <Navbar user={user} onLogout={handleLogout} />
              <LandingPage user={user} />
            </>
          } 
        />

        {/* Public Login */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : (
              <LoginPage 
                onLoginSuccess={handleLoginSuccess} 
                loginFn={api.auth.login} 
              />
            )
          } 
        />

        {/* Public Register */}
        <Route 
          path="/register" 
          element={
            user ? <Navigate to="/dashboard" replace /> : (
              <RegisterPage 
                onRegisterSuccess={handleLoginSuccess} 
                registerFn={api.auth.register} 
              />
            )
          } 
        />

        {/* Private Dashboard Workspace */}
        <Route 
          path="/dashboard" 
          element={
            !user ? <Navigate to="/login" replace /> : (
              <DashboardLayout
                user={user}
                projects={projects}
                activeProject={activeProject}
                onSelectProject={setActiveProject}
                onOpenCreateModal={() => setShowCreateModal(true)}
                activeModule={activeModule}
                onSelectModule={setActiveModule}
                onLogout={handleLogout}
                onDeleteProject={handleDeleteProject}
              >
                <Dashboard
                  user={user}
                  projects={projects}
                  activeProject={activeProject}
                  activeModule={activeModule}
                  onSelectModule={setActiveModule}
                  onOpenCreateModal={() => setShowCreateModal(true)}
                  onDeleteProject={handleDeleteProject}
                />
              </DashboardLayout>
            )
          } 
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-scale-up">
            <div className="bg-[#0c101b] px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit size={18} className="text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Integrate GitHub Repository</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-300 text-xs">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CodeMind Engine"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Codebase summarizer backend running express..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    GitHub URL (Mock checkout)
                  </label>
                  <input
                    type="text"
                    placeholder="https://github.com/org/repo"
                    value={newProjectGithub}
                    onChange={(e) => setNewProjectGithub(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Branch
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 pointer-events-none">
                      <GitBranch size={12} />
                    </span>
                    <input
                      type="text"
                      placeholder="main"
                      value={newProjectBranch}
                      onChange={(e) => setNewProjectBranch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-transparent border border-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-xs sm:text-sm font-medium transition-colors shadow-lg shadow-blue-600/20"
                >
                  {creating ? 'Indexing Repository...' : 'Create & Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}
