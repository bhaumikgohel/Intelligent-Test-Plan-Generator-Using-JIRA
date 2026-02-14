/**
 * JIRA Routes - Ticket fetching and history
 */
import { Router } from 'express';
import { createJiraClient } from '../services/jira-client';
import { dbGet, dbAll, dbRun } from '../utils/database';
import { secureStore } from '../utils/encryption';
import { sanitizeJiraId, isValidJiraId } from '../utils/validators';

const router = Router();

// Get stored JIRA config with decrypted token
const getJiraConfig = async () => {
  const config = await dbGet('SELECT value FROM settings WHERE key = ?', ['jira_config']);
  if (!config) return null;
  
  const parsed = JSON.parse(config.value);
  const apiToken = await secureStore.getPassword('jira-api-token');
  
  if (!apiToken) return null;
  
  return {
    baseUrl: parsed.baseUrl,
    username: parsed.username,
    apiToken
  };
};

// POST /api/jira/fetch - Fetch ticket details
router.post('/fetch', async (req, res) => {
  try {
    const { ticketId } = req.body;
    
    if (!ticketId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ticketId is required' 
      });
    }

    const sanitizedId = sanitizeJiraId(ticketId);
    
    if (!isValidJiraId(sanitizedId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid JIRA ID format. Expected: PROJECT-123' 
      });
    }

    const config = await getJiraConfig();
    if (!config) {
      return res.status(400).json({ 
        success: false, 
        error: 'JIRA not configured. Please configure JIRA settings first.' 
      });
    }

    const client = createJiraClient(config);
    const ticket = await client.fetchTicket(sanitizedId);

    // Save to recent tickets
    await dbRun(
      `INSERT OR REPLACE INTO recent_tickets (ticket_id, summary, data, fetched_at) 
       VALUES (?, ?, ?, datetime('now'))`,
      [ticket.key, ticket.summary, JSON.stringify(ticket)]
    );

    // Keep only last 10 recent tickets
    await dbRun(
      `DELETE FROM recent_tickets WHERE ticket_id NOT IN (
        SELECT ticket_id FROM recent_tickets ORDER BY fetched_at DESC LIMIT 10
      )`
    );

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/jira/recent - Get recently fetched tickets
router.get('/recent', async (req, res) => {
  try {
    const tickets = await dbAll(
      'SELECT ticket_id, summary, fetched_at FROM recent_tickets ORDER BY fetched_at DESC LIMIT 5'
    );
    
    res.json({ 
      success: true, 
      data: tickets.map(t => ({
        ticketId: t.ticket_id,
        summary: t.summary,
        fetchedAt: t.fetched_at
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
