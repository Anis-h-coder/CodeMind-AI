export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface ProjectStats {
  files: number;
  loc: number;
  functions: number;
  classes: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  githubUrl?: string;
  status: 'ready' | 'syncing' | 'error';
  activeBranch: string;
  lastSyncedAt?: string;
  stats: ProjectStats;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: any[];
}

export interface DiagnosticMetrics {
  fidelity: number;
  recall: number;
  precision: number;
  latencyMs: number;
  costCents: number;
}

export interface EvaluationRun {
  id: string;
  timestamp: string;
  model: string;
  datasetName: string;
  size: number;
  metrics: DiagnosticMetrics;
  status: 'completed' | 'running' | 'failed';
}
