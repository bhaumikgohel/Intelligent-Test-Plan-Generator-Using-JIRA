// API Service for backend communication

// Use environment variable for API URL, fallback to relative path
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Prepare headers
  const headers: Record<string, string> = {};
  
  // Only set Content-Type to JSON if body is NOT FormData
  // (browser will set correct Content-Type with boundary for FormData)
  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Merge with any custom headers
  const finalHeaders = { ...headers, ...(options.headers as Record<string, string> || {}) };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: finalHeaders,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Settings API
export const settingsApi = {
  // JIRA
  getJiraConfig: () => fetchApi<{ success: boolean; data: any }>('/settings/jira'),
  saveJiraConfig: (config: { baseUrl: string; username: string; apiToken: string }) =>
    fetchApi('/settings/jira', { method: 'POST', body: JSON.stringify(config) }),
  testJiraConnection: (config: { baseUrl: string; username: string; apiToken: string }) =>
    fetchApi('/settings/jira/test', { method: 'POST', body: JSON.stringify(config) }),

  // LLM
  getLlmConfig: () => fetchApi<{ success: boolean; data: any }>('/settings/llm'),
  saveLlmConfig: (config: { provider: string; groq?: any; ollama?: any }) =>
    fetchApi('/settings/llm', { method: 'POST', body: JSON.stringify(config) }),
  testLlmConnection: (config: { provider: string; groq?: any; ollama?: any }) =>
    fetchApi('/settings/llm/test', { method: 'POST', body: JSON.stringify(config) }),
  getOllamaModels: () => fetchApi<{ success: boolean; data: string[] }>('/settings/llm/models'),
};

// JIRA API
export const jiraApi = {
  fetchTicket: (ticketId: string) =>
    fetchApi<{ success: boolean; data: any }>('/jira/fetch', {
      method: 'POST',
      body: JSON.stringify({ ticketId }),
    }),
  getRecentTickets: () =>
    fetchApi<{ success: boolean; data: any[] }>('/jira/recent'),
};

// Templates API
export const templatesApi = {
  getAll: () => fetchApi<{ success: boolean; data: any[] }>('/templates'),
  getById: (id: string) => fetchApi<{ success: boolean; data: any }>(`/templates/${id}`),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi('/templates/upload', {
      method: 'POST',
      body: formData,
      // No headers - browser will set Content-Type with correct boundary for FormData
    });
  },
  delete: (id: string) => fetchApi(`/templates/${id}`, { method: 'DELETE' }),
};

// Test Plan API
export const testplanApi = {
  generate: (params: { ticketId: string; templateId: string; provider?: string }) =>
    fetchApi<{ success: boolean; data: any }>('/testplan/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  getHistory: () => fetchApi<{ success: boolean; data: any[] }>('/testplan/history'),
  streamGenerate: (params: { ticketId: string; templateId: string; provider?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return new EventSource(`${API_BASE}/testplan/stream?${query}`);
  },
};

// Health check
export const healthApi = {
  check: () => fetchApi('/health'),
};
