/**
 * Settings Routes - JIRA & LLM Configuration
 */
import { Router } from 'express';
import { secureStore } from '../utils/encryption';
import { dbGet, dbRun } from '../utils/database';
import { createJiraClient } from '../services/jira-client';
import { createGroqProvider } from '../services/llm-providers/groq';
import { createOllamaProvider } from '../services/llm-providers/ollama';

const router = Router();

// Account names for secure storage
const ACCOUNTS = {
  JIRA_TOKEN: 'jira-api-token',
  GROQ_KEY: 'groq-api-key'
};

// GET /api/settings/jira - Get connection status
router.get('/jira', async (req, res) => {
  try {
    const config = await dbGet('SELECT value FROM settings WHERE key = ?', ['jira_config']);
    
    if (!config) {
      return res.json({ success: true, data: { configured: false } });
    }

    const parsed = JSON.parse(config.value);
    // Don't return the actual token
    delete parsed.apiToken;
    
    res.json({ 
      success: true, 
      data: { 
        configured: true, 
        config: parsed 
      } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// POST /api/settings/jira - Save JIRA credentials
router.post('/jira', async (req, res) => {
  try {
    const { baseUrl, username, apiToken } = req.body;

    if (!baseUrl || !username || !apiToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: baseUrl, username, apiToken' 
      });
    }

    // Store encrypted token
    await secureStore.setPassword(ACCOUNTS.JIRA_TOKEN, apiToken);

    // Store config (without token)
    const config = { baseUrl, username };
    await dbRun(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['jira_config', JSON.stringify({ ...config, hasToken: true })]
    );

    res.json({ success: true, message: 'JIRA configuration saved' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// POST /api/settings/jira/test - Test JIRA connection
router.post('/jira/test', async (req, res) => {
  try {
    const { baseUrl, username, apiToken } = req.body;

    if (!baseUrl || !username || !apiToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const client = createJiraClient({ baseUrl, username, apiToken });
    const result = await client.testConnection();

    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/settings/llm - Get LLM configuration
router.get('/llm', async (req, res) => {
  try {
    const config = await dbGet('SELECT value FROM settings WHERE key = ?', ['llm_config']);
    
    if (!config) {
      return res.json({ 
        success: true, 
        data: { 
          provider: 'groq',
          groq: { model: 'llama3-70b-8192', temperature: 0.7 },
          ollama: { baseUrl: 'http://localhost:11434', model: '' }
        } 
      });
    }

    const parsed = JSON.parse(config.value);
    // Don't return actual API keys
    if (parsed.groq) delete parsed.groq.apiKey;
    
    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// POST /api/settings/llm - Save LLM configuration
router.post('/llm', async (req, res) => {
  try {
    const { provider, groq, ollama } = req.body;

    // Store Groq API key separately if provided
    if (groq?.apiKey) {
      await secureStore.setPassword(ACCOUNTS.GROQ_KEY, groq.apiKey);
    }

    // Store config
    const config = {
      provider,
      groq: groq ? { model: groq.model, temperature: groq.temperature, hasKey: !!groq.apiKey } : undefined,
      ollama
    };

    await dbRun(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['llm_config', JSON.stringify(config)]
    );

    res.json({ success: true, message: 'LLM configuration saved' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// POST /api/settings/llm/test - Test LLM connection
router.post('/llm/test', async (req, res) => {
  try {
    const { provider, groq, ollama } = req.body;

    let result;
    if (provider === 'groq') {
      if (!groq?.apiKey) {
        return res.status(400).json({ success: false, message: 'Groq API key required' });
      }
      const groqProvider = createGroqProvider(groq);
      result = await groqProvider.testConnection();
    } else {
      const ollamaProvider = createOllamaProvider(ollama || {});
      result = await ollamaProvider.testConnection();
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/settings/llm/models - List Ollama models
router.get('/llm/models', async (req, res) => {
  try {
    const config = await dbGet('SELECT value FROM settings WHERE key = ?', ['llm_config']);
    const ollamaConfig = config ? JSON.parse(config.value).ollama : { baseUrl: 'http://localhost:11434' };
    
    const provider = createOllamaProvider(ollamaConfig);
    const models = await provider.listModels();
    
    res.json({ success: true, data: models });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
