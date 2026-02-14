/**
 * Ollama Local LLM Provider
 */
import { OllamaConfig } from '../../types';

export class OllamaProvider {
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = config;
  }

  // Get base URL with default
  private getBaseUrl(): string {
    return this.config.baseUrl || 'http://localhost:11434';
  }

  // Test connection by fetching available models
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map((m: any) => m.name).join(', ') || 'No models found';
        return {
          success: true,
          message: `Connected. Available models: ${models}`
        };
      } else {
        return {
          success: false,
          message: `Ollama connection failed: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Ollama connection error: ${error instanceof Error ? error.message : 'Unknown error'}. Is Ollama running?`
      };
    }
  }

  // Fetch available models
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        return data.models?.map((m: any) => m.name) || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  // Generate test plan
  async generateTestPlan(
    ticketData: {
      key: string;
      summary: string;
      description: string;
      acceptanceCriteria?: string;
      priority: string;
    },
    templateContent: string
  ): Promise<string> {
    const systemPrompt = `You are a QA Engineer. Generate a comprehensive test plan based on the provided JIRA ticket and following the structure of the template below.`;

    const userPrompt = `
JIRA Ticket Data:
- Key: ${ticketData.key}
- Summary: ${ticketData.summary}
- Priority: ${ticketData.priority}
- Description: ${ticketData.description}
- Acceptance Criteria: ${ticketData.acceptanceCriteria || 'Not specified'}

Template Structure:
${templateContent}

Instructions:
1. Map ticket details to appropriate sections
2. Maintain template formatting
3. Add specific test scenarios based on acceptance criteria
4. Include both positive and negative test cases
5. Consider edge cases and boundary conditions

Generate a complete test plan following the template structure above.`;

    const response = await fetch(`${this.getBaseUrl()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false
      }),
      signal: AbortSignal.timeout(120000) // 120 seconds for local models
    });

    if (!response.ok) {
      throw new Error(`Ollama generation failed: ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'No content generated';
  }

  // Stream generation
  async *streamTestPlan(
    ticketData: {
      key: string;
      summary: string;
      description: string;
      acceptanceCriteria?: string;
      priority: string;
    },
    templateContent: string
  ): AsyncGenerator<string> {
    const systemPrompt = `You are a QA Engineer. Generate a comprehensive test plan.`;

    const userPrompt = `
JIRA Ticket: ${ticketData.key} - ${ticketData.summary}
Priority: ${ticketData.priority}
Description: ${ticketData.description}
Acceptance Criteria: ${ticketData.acceptanceCriteria || 'Not specified'}

Template:
${templateContent}

Generate a test plan following this template.`;

    const response = await fetch(`${this.getBaseUrl()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: true
      }),
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      throw new Error(`Ollama stream failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              yield data.response;
            }
          } catch {
            // Ignore parse errors for partial data
          }
        }
      }
    }
  }
}

export const createOllamaProvider = (config: OllamaConfig): OllamaProvider => {
  return new OllamaProvider(config);
};
