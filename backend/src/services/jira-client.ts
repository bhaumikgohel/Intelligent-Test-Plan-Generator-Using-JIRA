/**
 * JIRA REST API v3 Client
 */
import { JiraConfig, JiraTicket } from '../types';

export class JiraClient {
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
  }

  // Build request headers with authentication
  private getHeaders(): HeadersInit {
    const auth = Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Build full API URL
  private getApiUrl(endpoint: string): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    return `${baseUrl}/rest/api/3${endpoint}`;
  }

  // Test connection by fetching current user
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(this.getApiUrl('/myself'), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Connected as ${data.displayName} (${data.emailAddress})`
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          message: `Connection failed: ${response.status} - ${error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Fetch ticket details
  async fetchTicket(ticketId: string): Promise<JiraTicket> {
    const response = await fetch(this.getApiUrl(`/issue/${ticketId}`), {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Ticket ${ticketId} not found`);
      }
      throw new Error(`Failed to fetch ticket: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    return this.parseTicket(data);
  }

  // Parse JIRA API response to our Ticket type
  private parseTicket(data: any): JiraTicket {
    const fields = data.fields || {};
    
    // Extract acceptance criteria from description or custom field
    let acceptanceCriteria = '';
    if (fields.customfield_10014) { // Common custom field for AC
      acceptanceCriteria = fields.customfield_10014;
    } else if (fields.description) {
      acceptanceCriteria = this.extractAcceptanceCriteria(fields.description);
    }

    return {
      key: data.key,
      summary: fields.summary || '',
      description: this.formatDescription(fields.description),
      priority: fields.priority?.name || 'Medium',
      status: fields.status?.name || 'Unknown',
      assignee: fields.assignee?.displayName,
      labels: fields.labels || [],
      acceptanceCriteria
    };
  }

  // Format Atlassian Document Format (ADF) to plain text
  private formatDescription(description: any): string {
    if (!description) return '';
    
    // If it's already a string, return it
    if (typeof description === 'string') return description;
    
    // If it's ADF format, extract text
    if (description.content) {
      return this.extractTextFromADF(description);
    }
    
    return JSON.stringify(description);
  }

  // Recursively extract text from ADF
  private extractTextFromADF(node: any): string {
    if (!node) return '';
    
    if (typeof node === 'string') return node;
    
    if (node.text) return node.text;
    
    if (node.content && Array.isArray(node.content)) {
      return node.content.map((child: any) => this.extractTextFromADF(child)).join('');
    }
    
    return '';
  }

  // Extract acceptance criteria from description text
  private extractAcceptanceCriteria(description: any): string {
    const text = this.formatDescription(description);
    
    // Look for common AC patterns
    const patterns = [
      /Acceptance Criteria:?\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i,
      /AC:?\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i,
      /Given[\s\S]*?(?=\n\n|$)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1]?.trim() || match[0]?.trim();
      }
    }
    
    return '';
  }
}

// Factory function
export const createJiraClient = (config: JiraConfig): JiraClient => {
  return new JiraClient(config);
};
