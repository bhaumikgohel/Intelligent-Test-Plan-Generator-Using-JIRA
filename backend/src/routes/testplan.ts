/**
 * Test Plan Generation Routes
 */
import { Router, Response } from 'express';
import { createJiraClient } from '../services/jira-client';
import { createGroqProvider } from '../services/llm-providers/groq';
import { createOllamaProvider } from '../services/llm-providers/ollama';
import { dbGet, dbRun } from '../utils/database';
import { secureStore } from '../utils/encryption';
import { LLMProvider } from '../types';

const router = Router();

// Get stored configs
const getConfigs = async () => {
  const [jiraConfigRow, llmConfigRow] = await Promise.all([
    dbGet('SELECT value FROM settings WHERE key = ?', ['jira_config']),
    dbGet('SELECT value FROM settings WHERE key = ?', ['llm_config'])
  ]);

  const jiraConfig = (jiraConfigRow && jiraConfigRow.value) ? JSON.parse(jiraConfigRow.value) : null;
  const llmConfig = (llmConfigRow && llmConfigRow.value) ? JSON.parse(llmConfigRow.value) : null;

  // Get decrypted tokens
  if (jiraConfig) {
    jiraConfig.apiToken = await secureStore.getPassword('jira-api-token');
  }
  if (llmConfig?.groq?.hasKey) {
    llmConfig.groq.apiKey = await secureStore.getPassword('groq-api-key');
  }

  return { jiraConfig, llmConfig };
};

// POST /api/testplan/generate - Generate test plan
router.post('/generate', async (req, res) => {
  try {
    const { ticketId, templateId, provider } = req.body;

    if (!ticketId || !templateId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ticketId and templateId are required' 
      });
    }

    const { jiraConfig, llmConfig } = await getConfigs();

    if (!jiraConfig?.apiToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'JIRA not configured' 
      });
    }

    if (!llmConfig) {
      return res.status(400).json({ 
        success: false, 
        error: 'LLM not configured' 
      });
    }

    // Fetch ticket
    const jiraClient = createJiraClient(jiraConfig);
    const ticket = await jiraClient.fetchTicket(ticketId);

    // Fetch template
    const template = await dbGet('SELECT content FROM templates WHERE id = ?', [templateId]);
    if (!template || !template.content) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    // Select provider
    const selectedProvider: LLMProvider = provider || llmConfig.provider;
    let generatedContent: string;

    if (selectedProvider === 'groq') {
      if (!llmConfig.groq?.apiKey) {
        return res.status(400).json({ success: false, error: 'Groq API key not configured' });
      }
      const groq = createGroqProvider(llmConfig.groq);
      generatedContent = await groq.generateTestPlan(ticket, template.content);
    } else {
      const ollama = createOllamaProvider(llmConfig.ollama || {});
      generatedContent = await ollama.generateTestPlan(ticket, template.content);
    }

    // Save to history
    await dbRun(
      `INSERT INTO test_plan_history (ticket_id, template_id, generated_content, provider_used) 
       VALUES (?, ?, ?, ?)`,
      [ticketId, templateId, generatedContent, selectedProvider]
    );

    res.json({ 
      success: true, 
      data: {
        ticketId,
        templateId,
        providerUsed: selectedProvider,
        generatedContent,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/testplan/stream - SSE streaming endpoint
router.get('/stream', async (req, res: Response) => {
  const { ticketId, templateId, provider } = req.query as {
    ticketId: string;
    templateId: string;
    provider: LLMProvider;
  };

  if (!ticketId || !templateId) {
    return res.status(400).json({ success: false, error: 'ticketId and templateId required' });
  }

  // Setup SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { jiraConfig, llmConfig } = await getConfigs();

    if (!jiraConfig?.apiToken || !llmConfig) {
      res.write(`data: ${JSON.stringify({ error: 'Configuration missing' })}\n\n`);
      res.end();
      return;
    }

    // Fetch ticket and template
    const jiraClient = createJiraClient(jiraConfig);
    const ticket = await jiraClient.fetchTicket(ticketId);
    const template = await dbGet('SELECT content FROM templates WHERE id = ?', [templateId]);

    if (!template || !template.content) {
      res.write(`data: ${JSON.stringify({ error: 'Template not found' })}\n\n`);
      res.end();
      return;
    }

    // Stream based on provider
    const selectedProvider = provider || llmConfig.provider;
    let stream: AsyncGenerator<string>;

    if (selectedProvider === 'groq') {
      const groq = createGroqProvider(llmConfig.groq);
      stream = groq.streamTestPlan(ticket, template.content);
    } else {
      const ollama = createOllamaProvider(llmConfig.ollama || {});
      stream = ollama.streamTestPlan(ticket, template.content);
    }

    // Send chunks
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    res.write(`data: ${JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })}\n\n`);
    res.end();
  }
});

// GET /api/testplan/history - Get generation history
router.get('/history', async (req, res) => {
  try {
    const history = await dbGet(
      `SELECT h.*, t.name as template_name 
       FROM test_plan_history h
       LEFT JOIN templates t ON h.template_id = t.id
       ORDER BY h.created_at DESC LIMIT 20`
    );

    res.json({ success: true, data: history || [] });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
