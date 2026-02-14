/**
 * PDF Text Extraction Service
 */
import * as fs from 'fs';
import pdfParse from 'pdf-parse';

export interface ParsedPDF {
  text: string;
  numpages: number;
  info: any;
}

// Parse PDF buffer to text
export const parsePDFBuffer = async (buffer: Buffer): Promise<ParsedPDF> => {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      numpages: data.numpages,
      info: data.info
    };
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Parse PDF file to text
export const parsePDFFile = async (filePath: string): Promise<ParsedPDF> => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);
  return parsePDFBuffer(buffer);
};

// Extract template structure from PDF text
export const extractTemplateStructure = (text: string): string => {
  // Clean up the text
  let cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Try to identify sections (common patterns in test plans)
  const sectionPatterns = [
    /^(?:\d+\.\s*)?\w+/m,  // Numbered or titled sections
    /^[A-Z][A-Z\s]+$/m,    // ALL CAPS headers
    /^(?:Test\s+\w+|Scenario|Step|Description)/im  // Test-related keywords
  ];

  // If no clear structure found, try to organize into sections
  const lines = cleaned.split('\n');
  const structured: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this looks like a header
    const isHeader = sectionPatterns.some(pattern => pattern.test(trimmed));
    
    if (isHeader) {
      structured.push(`\n## ${trimmed}\n`);
    } else {
      structured.push(trimmed);
    }
  }

  return structured.join('\n');
};

// Validate PDF file (basic checks)
export const validatePDFFile = (buffer: Buffer): { valid: boolean; error?: string } => {
  // Check PDF magic number (%PDF)
  const pdfHeader = buffer.slice(0, 4).toString('ascii');
  if (pdfHeader !== '%PDF') {
    return { valid: false, error: 'Invalid PDF file format' };
  }

  // Check file size (limit to 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (buffer.length > maxSize) {
    return { valid: false, error: 'PDF file too large (max 5MB)' };
  }

  return { valid: true };
};
