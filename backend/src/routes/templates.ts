/**
 * Template Routes - PDF upload and management
 */
import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbAll, dbRun } from '../utils/database';
import { parsePDFBuffer, validatePDFFile, extractTemplateStructure } from '../services/pdf-parser';

const router = Router();

// Ensure templates directory exists
const TEMPLATES_DIR = path.join(process.cwd(), 'templates');
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// GET /api/templates - List all templates
router.get('/', async (req, res) => {
  try {
    const templates = await dbAll(
      'SELECT id, name, is_default, created_at FROM templates ORDER BY created_at DESC'
    );
    
    res.json({ 
      success: true, 
      data: templates.map((t: any) => ({
        id: t.id,
        name: t.name,
        isDefault: !!t.is_default,
        createdAt: t.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/templates/:id - Get template content
router.get('/:id', async (req, res) => {
  try {
    const template = await dbGet(
      'SELECT id, name, content, is_default FROM templates WHERE id = ?',
      [req.params.id]
    );
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json({ 
      success: true, 
      data: {
        id: template.id,
        name: template.name,
        content: template.content,
        isDefault: !!template.is_default
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// POST /api/templates/upload - Upload PDF template
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, error: 'File too large. Max size is 5MB.' });
      }
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Validate PDF
    const validation = validatePDFFile(req.file.buffer);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    // Parse PDF
    const parsed = await parsePDFBuffer(req.file.buffer);
    const structuredContent = extractTemplateStructure(parsed.text);

    // Generate ID and save
    const id = uuidv4();
    const name = req.file.originalname.replace('.pdf', '');

    // Save file to disk
    const filePath = path.join(TEMPLATES_DIR, `${id}.pdf`);
    fs.writeFileSync(filePath, req.file.buffer);

    // Save to database
    await dbRun(
      'INSERT INTO templates (id, name, content, is_default) VALUES (?, ?, ?, ?)',
      [id, name, structuredContent, 0]
    );

    res.json({ 
      success: true, 
      data: {
        id,
        name,
        pages: parsed.numpages,
        preview: structuredContent.substring(0, 500) + '...'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', async (req, res) => {
  try {
    // Don't allow deleting default template
    const template = await dbGet('SELECT is_default FROM templates WHERE id = ?', [req.params.id]);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    if (template.is_default) {
      return res.status(400).json({ success: false, error: 'Cannot delete default template' });
    }

    // Delete file
    const filePath = path.join(TEMPLATES_DIR, `${req.params.id}.pdf`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await dbRun('DELETE FROM templates WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
