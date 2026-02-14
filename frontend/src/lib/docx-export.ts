import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Convert markdown text to Word document and download
 */
export const downloadAsDocx = async (content: string, filename: string) => {
  const paragraphs = parseMarkdownToDocx(content);
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: paragraphs,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
};

/**
 * Parse markdown content into DocX paragraphs
 */
const parseMarkdownToDocx = (content: string): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      // Empty line - add spacing
      paragraphs.push(new Paragraph({ spacing: { after: 200 } }));
      continue;
    }
    
    // Heading 1: # Heading
    if (trimmedLine.match(/^#\s/)) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.replace(/^#\s/, ''),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }));
      continue;
    }
    
    // Heading 2: ## Heading
    if (trimmedLine.match(/^##\s/)) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.replace(/^##\s/, ''),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }));
      continue;
    }
    
    // Heading 3: ### Heading
    if (trimmedLine.match(/^###\s/)) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.replace(/^###\s/, ''),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 80 },
      }));
      continue;
    }
    
    // Table row - skip (simplified, tables need more complex handling)
    if (trimmedLine.startsWith('|')) {
      // Skip table separator lines
      if (trimmedLine.match(/^\|[-:\s|]+\|$/)) {
        continue;
      }
      // Simple table row as text
      const cells = trimmedLine
        .split('|')
        .filter(cell => cell.trim())
        .map(cell => cell.trim());
      
      if (cells.length > 0) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: cells.join(' | '),
              bold: true,
            }),
          ],
          spacing: { after: 100 },
          border: {
            bottom: {
              color: "999999",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
        }));
      }
      continue;
    }
    
    // Bullet list: - item or * item
    if (trimmedLine.match(/^[-*]\s/)) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.replace(/^[-*]\s/, ''),
        bullet: {
          level: 0,
        },
        spacing: { after: 80 },
      }));
      continue;
    }
    
    // Numbered list: 1. item
    if (trimmedLine.match(/^\d+\.\s/)) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.replace(/^\d+\.\s/, ''),
        numbering: {
          reference: "my-numbering",
          level: 0,
        },
        spacing: { after: 80 },
      }));
      continue;
    }
    
    // Regular paragraph with inline formatting
    paragraphs.push(parseInlineFormatting(trimmedLine));
  }
  
  return paragraphs;
};

/**
 * Parse inline markdown formatting (bold, italic, code)
 */
const parseInlineFormatting = (text: string): Paragraph => {
  const children: TextRun[] = [];
  
  // Split by formatting patterns
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  
  for (const part of parts) {
    if (!part) continue;
    
    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      children.push(new TextRun({
        text: part.slice(2, -2),
        bold: true,
      }));
    }
    // Italic: *text*
    else if (part.startsWith('*') && part.endsWith('*')) {
      children.push(new TextRun({
        text: part.slice(1, -1),
        italics: true,
      }));
    }
    // Inline code: `text`
    else if (part.startsWith('`') && part.endsWith('`')) {
      children.push(new TextRun({
        text: part.slice(1, -1),
        font: "Courier New",
        shading: {
          fill: "F5F5F5",
        },
      }));
    }
    // Regular text
    else {
      children.push(new TextRun({ text: part }));
    }
  }
  
  return new Paragraph({
    children,
    spacing: { after: 120 },
  });
};
