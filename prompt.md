# Intelligent Test Plan Generator (Full-Stack Web Application)**

### **Core Objective**
Build a full-stack web application that automates test plan creation by integrating JIRA ticket data with LLM-powered analysis using customizable templates. The app must support both cloud (Groq API) and local (Ollama) LLM providers.

### **Architecture & Tech Stack**
**Frontend:** React (Vite) + TypeScript + Tailwind CSS + shadcn/ui components  
**Backend:** Node.js (Express) or Python (FastAPI) - *[choose one]*  
**Storage:** Local SQLite (for settings/history) + File system (for templates)  
**LLM Integration:** Groq API SDK + Ollama local REST API  
**JIRA Integration:** JIRA REST API v3  

### **Detailed Feature Specifications**

#### **1. Configuration & Settings Module**
Create a persistent settings panel with three sections:

**A. JIRA Configuration**
- Form fields: JIRA Base URL (e.g., `https://company.atlassian.net`), Username/Email, API Token (encrypted storage)
- "Test Connection" button that validates credentials by fetching user info
- Connection status indicator (green/red badge)
- Secure storage: Use OS keychain or encrypted local config file (never expose keys in frontend build)

**B. LLM Provider Settings**
- **Groq Configuration:** API Key input, Model selection dropdown (llama3-70b, mixtral-8x7b, etc.), Temperature slider (0-1)
- **Ollama Configuration:** Base URL input (default: `http://localhost:11434`), Model selection (fetch available models from `/api/tags`)
- Toggle switch: "Use Local LLM (Ollama)" vs "Use Cloud LLM (Groq)"
- Validation: Test connection buttons for both providers

**C. Template Management**
- File upload zone for PDF templates (drag-and-drop)
- Parse and store template content (extract text from PDF, store in DB)
- Template preview panel showing current active template
- Default fallback template if none uploaded

#### **2. Main Workflow Interface**

**Step 1: Ticket Input**
- Clean input field for JIRA ID (e.g., "VWO-123") with validation
- "Fetch Ticket" button with loading state
- Recent tickets history (last 5 fetched, clickable to refill)

**Step 2: Data Display Panel**
After fetching, display:
- Ticket Key, Summary, Description (formatted)
- Priority, Status, Assignee, Labels
- Acceptance Criteria (parsed from description or custom field)
- Attachments list (if any)

**Step 3: Generation Controls**
- "Generate Test Plan" button
- Progress indicator: Fetching Ticket → Analyzing Context → Generating Plan → Complete
- Real-time streaming of LLM response (if supported by provider)

**Step 4: Output & Export**
- Markdown editor/preview for generated test plan
- Side-by-side view: Template structure vs Generated content
- Export options: Markdown, PDF, Copy to Clipboard
- "Save to History" functionality

#### **3. LLM Integration Logic**
**Context Construction:**
```
System Prompt: "You are a QA Engineer. Generate a comprehensive test plan based on the provided JIRA ticket and following the structure of the template below."

Context:
1. JIRA Ticket Data: {summary, description, acceptance_criteria, priority}
2. Template Structure: {extracted_sections_from_pdf}
3. Instructions: "Map ticket details to appropriate sections. Maintain template formatting. Add specific test scenarios based on acceptance criteria."
```

**Error Handling:**
- Timeout handling (30s for Groq, 120s for Ollama)
- Retry logic (3 attempts with exponential backoff)
- Fallback: If LLM fails, show structured error with suggestion to check model availability

#### **4. API Endpoints (Backend)**

```
POST /api/settings/jira        // Save JIRA credentials
GET  /api/settings/jira        // Get connection status
POST /api/settings/llm         // Save LLM config
GET  /api/settings/llm/models  // List available Ollama models

POST /api/jira/fetch           // Body: {ticketId: "VWO-123"}
GET  /api/jira/recent          // Get recently fetched tickets

POST /api/testplan/generate    // Body: {ticketId, templateId, provider: "groq|ollama"}
GET  /api/testplan/stream      // SSE endpoint for real-time generation (optional)

POST /api/templates/upload     // Multipart form data (PDF)
GET  /api/templates            // List available templates
```

#### **5. Security Requirements**
- **API Keys:** Never store in localStorage. Use backend environment variables or OS-specific secure storage (keytar library)
- **CORS:** Restrict to localhost only for local deployment
- **Input Validation:** Sanitize JIRA IDs (regex: `[A-Z]+-\d+`), validate URLs
- **PDF Processing:** Scan uploads for malicious content, limit file size (<5MB)

#### **6. UI/UX Design Requirements**
- **Layout:** Sidebar navigation (Settings, Generate, History), Main content area
- **Theme:** Clean, professional QA/Testing aesthetic (blue/gray palette)
- **Responsive:** Minimum width 1024px optimized (desktop-first tool)
- **Feedback:** Toast notifications for success/errors, loading skeletons during API calls
- **Keyboard Shortcuts:** Ctrl+Enter to generate, Ctrl+Shift+S to save

#### **7. Local Development Setup**
- **Environment Variables:** `.env.example` file with:
  ```
  JIRA_BASE_URL=
  JIRA_API_TOKEN=
  GROQ_API_KEY=
  OLLAMA_BASE_URL=http://localhost:11434
  ```
- **Docker Support:** Optional `docker-compose.yml` for one-command startup
- **Database:** SQLite auto-initialized on first run (`data/app.db`)

#### **8. File Structure**
```
/intelligent-test-plan-agent
├── /frontend
│   ├── src/
│   │   ├── components/ (ui/, forms/, jira-display/)
│   │   ├── pages/ (Dashboard, Settings, History)
│   │   ├── hooks/ (useJira, useLLM, useTemplates)
│   │   └── services/ (api.ts, storage.ts)
├── /backend
│   ├── src/
│   │   ├── routes/ (jira.ts, llm.ts, templates.ts)
│   │   ├── services/ (jira-client.ts, llm-providers/, pdf-parser.ts)
│   │   └── utils/ (encryption.ts, validators.ts)
├── /templates (default testplan.pdf storage)
└── README.md (setup instructions)
```

### **Deliverables Expected**
1. Fully functional local web server (runs on `http://localhost:3000`)
2. Frontend build optimized for production
3. Database schema initialization script
4. Setup documentation for:
   - Installing Ollama and pulling models
   - Getting JIRA API tokens
   - Getting Groq API keys
   - Running the application

### **Success Criteria**
- User can input JIRA credentials and successfully fetch ticket "VWO-1"
- User can upload `testplan.pdf` and system extracts structure
- User can generate test plan using both Groq (cloud) and Ollama (local) modes
- Generated content follows template structure while incorporating JIRA specifics
- All API keys persist securely between sessions

---

**Pro Tips for Using This Prompt:**
1. **Specify your preferred stack:** If you prefer Python over Node.js, replace the backend section with Flask/FastAPI equivalents
2. **Add your PDF template:** Attach your actual `/templates/TestPlan.pdf` to the context when submitting this to a coding assistant
3. **Request incremental delivery:** Ask for "Phase 1: JIRA Integration" first, then "Phase 2: LLM Integration" to ensure quality at each step