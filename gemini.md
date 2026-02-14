# 🤖 Project Constitution - gemini.md

> **The Law of the Project**  
> This document contains Data Schemas, Behavioral Rules, and Architectural Invariants.  
> ⚠️ Only modify when: schemas change, rules are added, or architecture is modified.

---

## 📋 Project Identity

| Attribute | Value |
|-----------|-------|
| **Project Name** | Intelligent Test Plan Generator |
| **Status** | 🟢 Phase 1: Blueprint Complete |
| **Created** | 2026-02-14 |

---

## 🎯 North Star

Build a full-stack web application that **automates test plan creation** by integrating JIRA ticket data with LLM-powered analysis using customizable templates.

---

## 🔌 Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **JIRA REST API v3** | Fetch ticket data (summary, description, AC) | Required |
| **Groq API** | Cloud LLM provider (llama3-70b, mixtral-8x7b) | Required |
| **Ollama Local API** | Local LLM provider (`http://localhost:11434`) | Required |
| **SQLite** | Local storage for settings, history, templates | Built-in |

---

## 📊 Data Schemas

### Settings Schema
```json
{
  "jira": {
    "baseUrl": "string (https://company.atlassian.net)",
    "username": "string",
    "apiToken": "string (encrypted)"
  },
  "llm": {
    "provider": "enum: 'groq' | 'ollama'",
    "groq": {
      "apiKey": "string (encrypted)",
      "model": "enum: 'llama3-70b' | 'mixtral-8x7b' | ...",
      "temperature": "number (0-1)"
    },
    "ollama": {
      "baseUrl": "string (default: http://localhost:11434)",
      "model": "string"
    }
  },
  "templates": [{
    "id": "string",
    "name": "string",
    "content": "string (extracted text from PDF)",
    "isDefault": "boolean"
  }]
}
```

### JIRA Ticket Schema (Input)
```json
{
  "key": "string (e.g., 'VWO-123')",
  "summary": "string",
  "description": "string",
  "priority": "string",
  "status": "string",
  "assignee": "string",
  "labels": ["string"],
  "acceptanceCriteria": "string (parsed from description)"
}
```

### Test Plan Generation Schema (Output)
```json
{
  "ticketId": "string",
  "templateId": "string",
  "generatedContent": "string (markdown)",
  "timestamp": "ISO datetime",
  "providerUsed": "enum: 'groq' | 'ollama'"
}
```

---

## 📜 Behavioral Rules

### UI/UX Rules
1. **Theme:** Clean, professional QA/Testing aesthetic (blue/gray palette)
2. **Layout:** Sidebar navigation, main content area
3. **Responsive:** Desktop-first (min-width 1024px)
4. **Keyboard Shortcuts:** 
   - `Ctrl+Enter` → Generate
   - `Ctrl+Shift+S` → Save

### Security Rules
1. **API Keys:** Never store in localStorage. Use backend secure storage only.
2. **CORS:** Restrict to localhost only for local deployment
3. **Input Validation:** Sanitize JIRA IDs (regex: `[A-Z]+-\d+`), validate URLs
4. **PDF Processing:** Scan uploads, limit file size (<5MB)

### LLM Rules
1. **System Prompt:** "You are a QA Engineer. Generate a comprehensive test plan based on the provided JIRA ticket and following the structure of the template below."
2. **Timeout:** 30s for Groq, 120s for Ollama
3. **Retry Logic:** 3 attempts with exponential backoff
4. **Context Template:**
   ```
   1. JIRA Ticket Data: {summary, description, acceptance_criteria, priority}
   2. Template Structure: {extracted_sections_from_pdf}
   3. Instructions: "Map ticket details to appropriate sections. Maintain template formatting. Add specific test scenarios based on acceptance criteria."
   ```

### Error Handling Rules
1. Show structured errors with suggestions
2. Fallback UI when LLM fails
3. Connection status indicators for all services

---

## 🏗️ Architectural Invariants

### Tech Stack (Locked)
| Layer | Technology |
|-------|------------|
| Frontend | React (Vite) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express |
| Database | SQLite |
| LLM | Groq SDK + Ollama REST API |
| PDF Parsing | pdf-parse or equivalent |

### API Endpoints (Required)
```
POST /api/settings/jira        // Save JIRA credentials
GET  /api/settings/jira        // Get connection status
POST /api/settings/llm         // Save LLM config
GET  /api/settings/llm/models  // List available Ollama models

POST /api/jira/fetch           // Body: {ticketId: "VWO-123"}
GET  /api/jira/recent          // Get recently fetched tickets

POST /api/testplan/generate    // Body: {ticketId, templateId, provider}
GET  /api/testplan/stream      // SSE endpoint for streaming (optional)

POST /api/templates/upload     // Multipart form data (PDF)
GET  /api/templates            // List available templates
```

### File Structure (Required)
```
/intelligent-test-plan-agent
├── /frontend          # React + Vite + TypeScript
├── /backend           # Express + SQLite
├── /templates         # Default testplan.pdf storage
└── README.md
```

---

## 🔧 Maintenance Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-14 | Initialized project structure | Phase 0 complete |
| 2026-02-14 | Defined Data Schemas from prompt.md | Phase 1 complete |

---

## ✅ Success Criteria

- [ ] User can input JIRA credentials and successfully fetch ticket "VWO-1"
- [ ] User can upload `testplan.pdf` and system extracts structure
- [ ] User can generate test plan using both Groq (cloud) and Ollama (local) modes
- [ ] Generated content follows template structure while incorporating JIRA specifics
- [ ] All API keys persist securely between sessions

---

*Last Updated: 2026-02-14*
