/**
 * Database Initialization Script
 * Run with: npm run db:init
 */
import { initDatabase, closeDatabase } from '../utils/database';

const init = async () => {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
};

init();
