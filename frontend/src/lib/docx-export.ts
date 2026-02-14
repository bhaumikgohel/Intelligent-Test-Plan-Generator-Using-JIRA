import { Document, Paragraph, TextRun, HeadingLevel, Packer, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Convert markdown text to Word document and download
 */
export const downloadAsDocx = async (content: string, filename: string) => {
  const children = parseMarkdownToDocx(content);
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
};

/**
 * Parse markdown content into DocX elements
 */
const parseMarkdownToDocx = (content: string): (Paragraph | Table)[] => {
  const children: (Paragraph | Table)[] = [];
  const lines = content.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      i++;
      continue;
    }
    
    // Check if this is a table
    if (trimmedLine.startsWith('|')) {
      const tableResult = parseTable(lines, i);
      if (tableResult.table) {
        children.push(tableResult.table);
        i = tableResult.newIndex;
        continue;
      }
    }
    
    // Heading 1: # Heading
    if (trimmedLine.match(/^#\s/)) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.replace(/^#\s/, ''), bold: true, size: 32 })],
        spacing: { before: 240, after: 120 },
      }));
      i++;
      continue;
    }
    
    // Heading 2: ## Heading
    if (trimmedLine.match(/^##\s/)) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.replace(/^##\s/, ''), bold: true, size: 28 })],
        spacing: { before: 200, after: 100 },
      }));
      i++;
      continue;
    }
    
    // Heading 3: ### Heading
    if (trimmedLine.match(/^###\s/)) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmedLine.replace(/^###\s/, ''), bold: true, size: 24 })],
        spacing: { before: 160, after: 80 },
      }));
      i++;
      continue;
    }
    
    // Bullet list: - item or * item
    if (trimmedLine.match(/^[-*]\s/)) {
      children.push(new Paragraph({
        children: parseInlineFormatting(trimmedLine.replace(/^[-*]\s/, '')).children,
        bullet: { level: 0 },
        spacing: { after: 80 },
      }));
      i++;
      continue;
    }
    
    // Numbered list: 1. item
    if (trimmedLine.match(/^\d+\.\s/)) {
      children.push(new Paragraph({
        children: parseInlineFormatting(trimmedLine.replace(/^\d+\.\s/, '')).children,
        spacing: { after: 80 },
      }));
      i++;
      continue;
    }
    
    // Regular paragraph
    children.push(parseInlineFormatting(trimmedLine));
    i++;
  }
  
  return children;
};

/**
 * Parse a markdown table starting at the given line index
 */
const parseTable = (lines: string[], startIndex: number): { table: Table | null, newIndex: number } => {
  const rows: TableRow[] = [];
  let i = startIndex;
  let isFirstRow = true;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (!line.startsWith('|')) {
      break;
    }
    
    // Skip separator line (|----|----|)
    if (line.match(/^\|[-:\s|]+\|$/)) {
      i++;
      continue;
    }
    
    // Parse row cells
    const cells = line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell);
    
    if (cells.length === 0) {
      i++;
      continue;
    }
    
    const tableCells = cells.map(cellText => {
      const cellContent = parseInlineFormatting(cellText);
      return new TableCell({
        children: [new Paragraph({
          children: cellContent.children,
          spacing: { before: 60, after: 60 },
        })],
        width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
        verticalAlign: 'center',
      });
    });
    
    rows.push(new TableRow({
      children: tableCells,
      tableHeader: isFirstRow,
    }));
    
    isFirstRow = false;
    i++;
  }
  
  if (rows.length === 0) {
    return { table: null, newIndex: startIndex + 1 };
  }
  
  const table = new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    },
  });
  
  return { table, newIndex: i };
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
        font: 'Courier New',
        shading: { fill: 'F5F5F5' },
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
