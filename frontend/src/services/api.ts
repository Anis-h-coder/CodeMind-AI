import { User, Project } from '../types';

const API_BASE = '/api';

function getHeaders() {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('codemind_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });
  } catch (netErr: any) {
    throw new Error(`Connection error: Unable to reach the backend API server (${netErr.message || 'Network failure'}).`);
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any = {};

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  } else {
    const rawText = await response.text();
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`API endpoint not found (HTTP 404). Check if the Vercel backend serverless function is configured or DATABASE_URL / environment variables are set.`);
      }
      if (response.status === 500) {
        throw new Error(`Database connection failed on server (HTTP 500). Please ensure DATABASE_URL is set in Vercel Environment Variables.`);
      }
      throw new Error(`Backend server error (HTTP ${response.status} ${response.statusText || 'Server Error'}). Check Vercel logs.`);
    }
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`Unexpected non-JSON response from server.`);
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('codemind_token');
      localStorage.removeItem('codemind_user');
    }
    const errPayload = typeof data?.error === 'object' ? (data.error?.message || JSON.stringify(data.error)) : data?.error;
    const errMsg = errPayload || data?.message || `Database or Server Error (${response.status}). Please verify DATABASE_URL in Vercel settings.`;
    const err = new Error(errMsg);
    if (data?.stage) (err as any).stage = data.stage;
    throw err;
  }

  return data as T;
}

export const api = {
  auth: {
    login: async (email: string, name?: string) => {
      // For testing comfort, if name is passed we register, else we login.
      const payload = { email, password: 'password123', name };
      const endpoint = name ? '/auth/register' : '/auth/login';
      const data = await request<{ user: User; token: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      localStorage.setItem('codemind_token', data.token);
      localStorage.setItem('codemind_user', JSON.stringify(data.user));
      return data;
    },
    register: async (name: string, email: string) => {
      const data = await request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password: 'password123' }),
      });
      localStorage.setItem('codemind_token', data.token);
      localStorage.setItem('codemind_user', JSON.stringify(data.user));
      return data;
    },
    logout: () => {
      localStorage.removeItem('codemind_token');
      localStorage.removeItem('codemind_user');
    },
    getProfile: async () => {
      return request<{ user: User }>('/auth/me');
    },
  },
  sql: {
    query: async (projectId: string, question: string) => {
      return request<any>(`/projects/${projectId}/sql/query`, {
        method: 'POST',
        body: JSON.stringify({ question }),
      });
    },
    explain: async (projectId: string, sql: string) => {
      return request<{ success: boolean; explanation: string }>(`/projects/${projectId}/sql/explain`, {
        method: 'POST',
        body: JSON.stringify({ sql }),
      });
    },
    history: async (projectId: string) => {
      return request<{ success: boolean; history: any[] }>(`/projects/${projectId}/sql/history`);
    },
    schema: async (projectId: string) => {
      return request<{ success: boolean; tables: any[]; exampleQuestions: string[] }>(`/projects/${projectId}/sql/schema`);
    },
  },
  projects: {
    list: async () => {
      return request<Project[]>('/projects');
    },
    create: async (project: Partial<Project>) => {
      return request<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(project),
      });
    },
    delete: async (id: string) => {
      return request<{ success: boolean }>(`/projects/${id}`, {
        method: 'DELETE',
      });
    },
    metrics: async () => {
      return request<{
        success: boolean;
        metrics: {
          totalProjects: number;
          totalRepositories: number;
          totalFiles: number;
          totalChunks: number;
          totalAiQueries: number;
          totalEvaluations: number;
        };
      }>('/projects/metrics');
    },
    connectGithub: async (projectId: string, githubUrl: string) => {
      return request<{ success: boolean; repository: any }>(`/projects/${projectId}/github`, {
        method: 'POST',
        body: JSON.stringify({ githubUrl }),
      });
    },
    indexGithub: async (projectId: string) => {
      return request<{ success: boolean; status: string; message: string }>(`/projects/${projectId}/github/index`, {
        method: 'POST',
      });
    },
    getRepository: async (projectId: string) => {
      return request<{ success: boolean; repository: any }>(`/projects/${projectId}/repository`);
    },
    listFiles: async (projectId: string, page = 1, limit = 100) => {
      return request<{
        success: boolean;
        files: any[];
        pagination: { page: number; limit: number; total: number };
      }>(`/projects/${projectId}/files?page=${page}&limit=${limit}`);
    },
    getFile: async (projectId: string, fileId: string) => {
      return request<{ success: boolean; file: any }>(`/projects/${projectId}/files/${fileId}`);
    },
    disconnectGithub: async (projectId: string) => {
      return request<{ success: boolean; message: string }>(`/projects/${projectId}/github`, {
        method: 'DELETE',
      });
    },
    chat: async (projectId: string, question: string, conversationId?: string | null) => {
      return request<{
        success: boolean;
        conversationId: string;
        answer: string;
        sources: Array<{ filePath: string; startLine: number; endLine: number; similarity: number }>;
        retrievedChunks: number;
        latency: number;
      }>(`/projects/${projectId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ question, conversationId }),
      });
    },
    deleteFile: async (projectId: string, fileId: string) => {
      return request<{ success: boolean; message: string }>(`/projects/${projectId}/files/${fileId}`, {
        method: 'DELETE',
      });
    },
    listConversations: async (projectId: string) => {
      return request<{ success: boolean; conversations: any[] }>(`/projects/${projectId}/conversations`);
    },
    deleteConversation: async (conversationId: string) => {
      return request<{ success: boolean; message: string }>(`/conversations/${conversationId}`, {
        method: 'DELETE',
      });
    },
    listMessages: async (conversationId: string) => {
      return request<{ success: boolean; messages: any[] }>(`/conversations/${conversationId}/messages`);
    },
  },
  evaluations: {
    run: async (projectId: string) => {
      return request<any>(`/projects/${projectId}/evaluations/run`, {
        method: 'POST',
      });
    },
    trigger: async (projectId: string) => {
      return request<any>(`/projects/${projectId}/evaluations/run`, {
        method: 'POST',
      });
    },
    list: async (projectId: string) => {
      return request<{ success: boolean; runs: any[] }>(`/projects/${projectId}/evaluations`);
    },
    get: async (projectId: string, runId: string) => {
      return request<{ success: boolean; run: any }>(`/projects/${projectId}/evaluations/${runId}`);
    },
    results: async (projectId: string, runId: string) => {
      return request<{ success: boolean; results: any[] }>(`/projects/${projectId}/evaluations/${runId}/results`);
    },
  },
};
