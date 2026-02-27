/**
 * Database connection and utilities
 * Supports both SQLite (local) and PostgreSQL (production)
 */
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

// Database configuration
const DB_TYPE = process.env.DB_TYPE || 'sqlite';
const DATABASE_URL = process.env.DATABASE_URL;

// SQLite setup
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

// Ensure data directory exists for SQLite
if (DB_TYPE === 'sqlite' && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create database connection
let sqliteDb: sqlite3.Database | null = null;

if (DB_TYPE === 'sqlite') {
  sqliteDb = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database at', DB_PATH);
    }
  });
}

// PostgreSQL client (lazy loaded)
let pgClient: any = null;
let pgPool: any = null;

const getPostgresPool = async () => {
  if (!pgPool && DB_TYPE === 'postgres') {
    const { Pool } = await import('pg');
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for Render PostgreSQL
      }
    });
    console.log('Connected to PostgreSQL database');
  }
  return pgPool;
};

// Promisified db.run for SQLite
const sqliteRun = (sql: string, params: any[] = []): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) return reject(new Error('SQLite not initialized'));
    // Convert PostgreSQL $1, $2... to SQLite ?, ?...
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    sqliteDb.run(sqliteSql, params, function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Promisified db.get for SQLite
const sqliteGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) return reject(new Error('SQLite not initialized'));
    // Convert PostgreSQL $1, $2... to SQLite ?, ?...
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    sqliteDb.get(sqliteSql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Promisified db.all for SQLite
const sqliteAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) return reject(new Error('SQLite not initialized'));
    // Convert PostgreSQL $1, $2... to SQLite ?, ?...
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    sqliteDb.all(sqliteSql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// PostgreSQL query wrapper
const postgresQuery = async (sql: string, params: any[] = []): Promise<any> => {
  const pool = await getPostgresPool();
  const result = await pool.query(sql, params);
  return result.rows;
};

// Database operation wrappers
export const dbRun = async (sql: string, params: any[] = []): Promise<void> => {
  if (DB_TYPE === 'postgres') {
    await postgresQuery(sql, params);
  } else {
    await sqliteRun(sql, params);
  }
};

export const dbGet = async (sql: string, params: any[] = []): Promise<any> => {
  if (DB_TYPE === 'postgres') {
    const rows = await postgresQuery(sql, params);
    return rows[0] || null;
  } else {
    return sqliteGet(sql, params);
  }
};

export const dbAll = async (sql: string, params: any[] = []): Promise<any[]> => {
  if (DB_TYPE === 'postgres') {
    return postgresQuery(sql, params);
  } else {
    return sqliteAll(sql, params);
  }
};

// Initialize database tables
export const initDatabase = async (): Promise<void> => {
  console.log(`Initializing ${DB_TYPE} database...`);
  
  if (DB_TYPE === 'postgres') {
    await initPostgresTables();
  } else {
    await initSqliteTables();
  }
  
  console.log('Database initialized successfully');
};

// Initialize PostgreSQL tables
const initPostgresTables = async (): Promise<void> => {
  const queries = [
    // Settings table
    `CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Templates table
    `CREATE TABLE IF NOT EXISTS templates (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Recent tickets table
    `CREATE TABLE IF NOT EXISTS recent_tickets (
      ticket_id VARCHAR(255) PRIMARY KEY,
      summary TEXT,
      data TEXT,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Generated test plans history
    `CREATE TABLE IF NOT EXISTS test_plan_history (
      id SERIAL PRIMARY KEY,
      ticket_id VARCHAR(255) NOT NULL,
      template_id VARCHAR(255),
      generated_content TEXT NOT NULL,
      provider_used VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const query of queries) {
    await dbRun(query);
  }

  // Insert default template if none exists
  const defaultTemplate = await dbGet('SELECT id FROM templates WHERE is_default = TRUE');
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
      `INSERT INTO templates (id, name, content, is_default) VALUES ($1, $2, $3, $4)`,
      ['default', 'Default Test Plan Template', defaultContent, true]
    );
    console.log('Default template created');
  }
};

// Initialize SQLite tables
const initSqliteTables = async (): Promise<void> => {
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
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  if (DB_TYPE === 'sqlite' && sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } else if (DB_TYPE === 'postgres' && pgPool) {
    await pgPool.end();
  }
};
