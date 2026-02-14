/**
 * Input validation utilities
 */

// JIRA ID validation: PROJECT-123 format
export const isValidJiraId = (ticketId: string): boolean => {
  const regex = /^[A-Z]+-\d+$/;
  return regex.test(ticketId);
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// JIRA base URL validation (must be atlassian.net or custom domain)
export const isValidJiraBaseUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  const validPatterns = [
    /\.atlassian\.net$/i,
    /\.jira\.com$/i,
  ];
  return validPatterns.some(pattern => pattern.test(url));
};

// Sanitize JIRA ID
export const sanitizeJiraId = (ticketId: string): string => {
  return ticketId.trim().toUpperCase();
};

// Temperature validation (0-1)
export const isValidTemperature = (temp: number): boolean => {
  return temp >= 0 && temp <= 1;
};
