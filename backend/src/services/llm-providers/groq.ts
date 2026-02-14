/**
 * Groq Cloud LLM Provider
 */
import Groq from 'groq-sdk';
import { GroqConfig } from '../../types';

export class GroqProvider {
  private client: Groq;
  private config: GroqConfig;

  constructor(config: GroqConfig) {
    this.config = config;
    this.client = new Groq({
      apiKey: config.apiKey,
      timeout: 30000 // 30 seconds
    });
  }

  // Test connection by listing models
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const models = await this.client.models.list();
      const availableModels = models.data?.map(m => m.id).join(', ') || 'No models found';
      return {
        success: true,
        message: `Connected. Available models: ${availableModels}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Groq connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
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

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: this.config.temperature,
        max_tokens: 4096
      });

      return response.choices[0]?.message?.content || 'No content generated';
    } catch (error) {
      throw new Error(`Groq generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Stream generation (for real-time updates)
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

    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: this.config.temperature,
      max_tokens: 4096,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}

export const createGroqProvider = (config: GroqConfig): GroqProvider => {
  return new GroqProvider(config);
};
