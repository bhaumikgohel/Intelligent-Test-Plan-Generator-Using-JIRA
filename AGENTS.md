# 🤖 AI Coding Agent Guide

This guide provides essential information for AI coding agents working on this project.

---

## 📋 Project Overview

This project follows the **B.L.A.S.T.** (Blueprint, Link, Architect, Stylize, Trigger) protocol and the **A.N.T.** 3-layer architecture for building deterministic, self-healing automation in **Antigravity**.

**Current Status:** The project is in its initial phase. Only the `BLAST.md` protocol document exists. The directory structure and project files need to be initialized according to Protocol 0.

---

## 🏗️ Architecture Overview

### A.N.T. 3-Layer Architecture

| Layer | Directory | Purpose |
|-------|-----------|---------|
| Layer 1 | `architecture/` | Technical SOPs written in Markdown. Define goals, inputs, tool logic, and edge cases. |
| Layer 2 | Navigation (in-agent) | Reasoning layer. Route data between SOPs and Tools. |
| Layer 3 | `tools/` | Deterministic Python scripts. Atomic and testable. |

---

## 📂 Expected Project Structure

```
├── gemini.md          # Project Map & State Tracking (The "Constitution")
├── BLAST.md           # B.L.A.S.T. Protocol Reference
├── AGENTS.md          # This file - Guide for AI coding agents
├── .env               # API Keys/Secrets (Verified in 'Link' phase)
├── architecture/      # Layer 1: SOPs (The "How-To")
│   └── *.md           # Technical SOP documents
├── tools/             # Layer 3: Python Scripts (The "Engines")
│   └── *.py           # Deterministic automation scripts
├── .tmp/              # Temporary Workbench (Intermediates)
│   └── *              # Scraped data, logs, temporary files
├── task_plan.md       # Phases, goals, and checklists
├── findings.md        # Research, discoveries, constraints
└── progress.md        # What was done, errors, tests, results
```

---

## 🚀 Development Workflow (B.L.A.S.T. Protocol)

### Phase 0: Initialization (Mandatory)

**BEFORE writing any code or tools:**

1. **Initialize Project Memory** - Create these files:
   - `task_plan.md` → Phases, goals, and checklists
   - `findings.md` → Research, discoveries, constraints
   - `progress.md` → What was done, errors, tests, results
   - `gemini.md` → Project Constitution (Data schemas, Behavioral rules, Architectural invariants)

2. **Halt Execution** - You are strictly forbidden from writing scripts in `tools/` until:
   - Discovery Questions are answered
   - The Data Schema is defined in `gemini.md`
   - `task_plan.md` has an approved Blueprint

### Phase 1: Blueprint (Vision & Logic)

1. **Discovery** - Answer these 5 questions:
   - **North Star:** What is the singular desired outcome?
   - **Integrations:** Which external services (Slack, Shopify, etc.) do we need? Are keys ready?
   - **Source of Truth:** Where does the primary data live?
   - **Delivery Payload:** How and where should the final result be delivered?
   - **Behavioral Rules:** How should the system "act"? (Tone, logic constraints, "Do Not" rules)

2. **Data-First Rule** - Define the **JSON Data Schema** (Input/Output shapes) in `gemini.md`. Coding only begins once the "Payload" shape is confirmed.

3. **Research** - Search GitHub repos and other databases for helpful resources.

### Phase 2: Link (Connectivity)

1. **Verification** - Test all API connections and `.env` credentials.
2. **Handshake** - Build minimal scripts in `tools/` to verify external services respond correctly.

### Phase 3: Architect (The 3-Layer Build)

Implement within the 3-layer architecture (see Architecture Overview above).

**Golden Rule:** If logic changes, update the SOP in `architecture/` BEFORE updating the code.

### Phase 4: Stylize (Refinement & UI)

1. **Payload Refinement** - Format outputs (Slack blocks, Notion layouts, Email HTML) professionally.
2. **UI/UX** - Apply clean CSS/HTML and intuitive layouts if building a frontend.
3. **Feedback** - Present results to the user before final deployment.

### Phase 5: Trigger (Deployment)

1. **Cloud Transfer** - Move finalized logic to production.
2. **Automation** - Set up triggers (Cron jobs, Webhooks, Listeners).
3. **Documentation** - Finalize the **Maintenance Log** in `gemini.md`.

---

## 📜 Core Operating Principles

### 1. The "Data-First" Rule

Before building any Tool:

- Define the **Data Schema** in `gemini.md`.
- What does the raw input look like?
- What does the processed output look like?
- Coding only begins once the "Payload" shape is confirmed.

**After any meaningful task:**
- Update `progress.md` with what happened and any errors.
- Store discoveries in `findings.md`.
- Only update `gemini.md` when:
  - A schema changes
  - A rule is added
  - Architecture is modified

> **Rule:** `gemini.md` is *law*. The planning files are *memory*.

### 2. Self-Annealing (The Repair Loop)

When a Tool fails or an error occurs:

1. **Analyze** - Read the stack trace and error message. Do not guess.
2. **Patch** - Fix the Python script in `tools/`.
3. **Test** - Verify the fix works.
4. **Update Architecture** - Update the corresponding `.md` file in `architecture/` with the new learning.

### 3. Deliverables vs. Intermediates

- **Local (`.tmp/`):** All scraped data, logs, and temporary files. These are ephemeral and can be deleted.
- **Global (Cloud):** The "Payload." Google Sheets, Databases, or UI updates. **A project is only "Complete" when the payload is in its final cloud destination.**

---

## 🧪 Testing Strategy

- Tools in `tools/` should be **atomic and testable**.
- Each script should have a single, well-defined responsibility.
- Verify API connections in the Link phase before building full logic.
- Log all tests and results in `progress.md`.

---

## 🔒 Security Considerations

- **Environment Variables:** All API keys, tokens, and secrets MUST be stored in `.env`.
- **No Hardcoded Secrets:** Never commit credentials to version control.
- **Temporary Files:** Keep sensitive intermediate data in `.tmp/` which should be excluded from version control.
- **Verification:** Always verify credentials work before proceeding to build tools.

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Platform | Antigravity |
| Protocol | B.L.A.S.T. |
| Architecture | A.N.T. 3-Layer |
| Scripting | Python |
| Documentation | Markdown |
| Configuration | `.env` files |

---

## ⚠️ Important Constraints

1. **Reliability over Speed** - Never guess at business logic.
2. **Do Not Proceed Without Schema** - Coding only begins after `gemini.md` has confirmed Data Schema.
3. **Update SOPs First** - If logic changes, update `architecture/` SOPs before code.
4. **No Tools Without Link** - Do not write full tools until external service connections are verified.

---

## 📚 Reference Files

- `BLAST.md` - Complete B.L.A.S.T. protocol documentation
- `gemini.md` - Project Constitution (to be created)
- `task_plan.md` - Project phases and goals (to be created)
- `findings.md` - Research and discoveries (to be created)
- `progress.md` - Execution log (to be created)

---

*This project prioritizes reliability over speed. Always follow the B.L.A.S.T. protocol and A.N.T. architecture.*
