// JIRA Types
export interface JiraTicket {
  key: string;
  summary: string;
  description: string;
  priority: string;
  status: string;
  assignee?: string;
  labels: string[];
  acceptanceCriteria?: string;
}

export interface JiraConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
}

// LLM Types
export type LLMProvider = 'groq' | 'ollama';

export interface GroqConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

export interface LLMConfig {
  provider: LLMProvider;
  groq: GroqConfig;
  ollama: OllamaConfig;
}

// Template Types
export interface Template {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
}

// Test Plan Types
export interface TestPlanGeneration {
  id?: number;
  ticketId: string;
  templateId: string;
  generatedContent: string;
  providerUsed: LLMProvider;
  timestamp: string;
}

// Settings Type
export interface AppSettings {
  jira: JiraConfig;
  llm: LLMConfig;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
