/**
 * Secure credential storage using OS keychain via keytar
 * Fallback to simple encryption if keytar fails
 */
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SERVICE_NAME = 'testplan-generator';

// Simple encryption key derived from machine-specific info
// In production, use a proper key management system
const getEncryptionKey = (): Buffer => {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey) {
    return crypto.scryptSync(envKey, 'salt', 32);
  }
  // Fallback: generate from service name (not secure for production!)
  return crypto.scryptSync(SERVICE_NAME, 'salt', 32);
};

// Encrypt sensitive data
export const encrypt = (text: string): string => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return iv + authTag + encrypted data
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

// Decrypt sensitive data
export const decrypt = (encryptedData: string): string => {
  const key = getEncryptionKey();
  const parts = encryptedData.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Try to use keytar if available, otherwise use custom encryption
export const secureStore = {
  async setPassword(account: string, password: string): Promise<void> {
    try {
      const keytar = await import('keytar');
      await keytar.default.setPassword(SERVICE_NAME, account, password);
    } catch {
      // Fallback: store encrypted in memory (for development)
      process.env[`__SECURE_${account}__`] = encrypt(password);
    }
  },

  async getPassword(account: string): Promise<string | null> {
    try {
      const keytar = await import('keytar');
      return await keytar.default.getPassword(SERVICE_NAME, account);
    } catch {
      // Fallback
      const encrypted = process.env[`__SECURE_${account}__`];
      return encrypted ? decrypt(encrypted) : null;
    }
  },

  async deletePassword(account: string): Promise<void> {
    try {
      const keytar = await import('keytar');
      await keytar.default.deletePassword(SERVICE_NAME, account);
    } catch {
      delete process.env[`__SECURE_${account}__`];
    }
  }
};
