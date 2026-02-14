/**
 * SQLite database connection and utilities
 */
import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create database connection
export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at', DB_PATH);
  }
});

// Promisified methods
export const dbRun = promisify(db.run.bind(db));
export const dbGet = promisify(db.get.bind(db));
export const dbAll = promisify(db.all.bind(db));

// Initialize database tables
export const initDatabase = async (): Promise<void> => {
  const queries = [
    // Settings table
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Templates table
    `CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Recent tickets table
    `CREATE TABLE IF NOT EXISTS recent_tickets (
      ticket_id TEXT PRIMARY KEY,
      summary TEXT,
      data TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Generated test plans history
    `CREATE TABLE IF NOT EXISTS test_plan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL,
      template_id TEXT,
      generated_content TEXT NOT NULL,
      provider_used TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const query of queries) {
    await dbRun(query);
  }

  // Insert default template if none exists
  const defaultTemplate = await dbGet('SELECT id FROM templates WHERE is_default = 1');
  if (!defaultTemplate) {
    const defaultContent = `# Test Plan Template

## 1. Overview
- **Ticket ID:** {{TICKET_ID}}
- **Summary:** {{SUMMARY}}
- **Priority:** {{PRIORITY}}

## 2. Test Scope
### In Scope
- Feature functionality as per acceptance criteria
- UI/UX validation
- Edge cases

### Out of Scope
- Performance testing
- Security testing (unless specified)

## 3. Test Scenarios
{{TEST_SCENARIOS}}

## 4. Test Cases
| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
{{TEST_CASES}}

## 5. Acceptance Criteria Validation
{{AC_VALIDATION}}

## 6. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
{{RISKS}}
`;
    await dbRun(
      `INSERT INTO templates (id, name, content, is_default) VALUES (?, ?, ?, ?)`,
      ['default', 'Default Test Plan Template', defaultContent, 1]
    );
    console.log('Default template created');
  }

  console.log('Database initialized successfully');
};

// Close database connection
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};
