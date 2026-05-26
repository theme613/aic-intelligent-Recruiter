# AI Intelligent Recruiter

An intelligent recruitment web application that ingests a job description and candidate resumes, then uses a **7-step AI agent pipeline** (Google Gemini) to rank candidates, detect **hidden gems**, and generate personalized pitches, skills-gap analysis, and outreach drafts.

Built for the **APU AIC** hackathon.

---

## Repository

**Public repository:** [https://github.com/theme613/aic-intelligent-Recruiter](https://github.com/theme613/aic-intelligent-Recruiter)

---

## Features

| Feature | Description |
|---------|-------------|
| **Job intake** | Title, company, required skills, experience level, full job description |
| **Resume upload** | Drag-and-drop **PDF**, **TXT**, **DOCX**; manual text paste |
| **7-step AI pipeline** | Parse JD → parse candidates → vector search → rerank → hidden-gem detection → pitches → outreach |
| **Hidden Gem Detector** | Surfaces strong candidates whose titles do not match the role (e.g. designer with React skills) |
| **Streaming results** | Live reasoning log and progressive candidate cards |
| **Demo mode** | Full UI flow without an API key using built-in sample data |
| **Export** | Download ranked results as JSON |

---

## System Requirements

| Requirement | Minimum |
|-------------|---------|
| **Node.js** | 20.x or later (22.x recommended) |
| **npm** | 10.x or later (ships with Node.js) |
| **OS** | Windows 10+, macOS 12+, or Linux |
| **RAM** | 4 GB+ for local development |
| **Disk** | ~500 MB for `node_modules` |
| **Browser** | Modern Chromium, Firefox, or Safari (for UI) |
| **Internet** | Required for Gemini API calls (not required for demo mode) |

### Optional (for deployment)

- [Vercel](https://vercel.com) account (recommended hosting)
- [Google AI Studio](https://aistudio.google.com/apikey) API key for live AI analysis

---

## Dependencies

### Runtime (`package.json`)

| Package | Purpose |
|---------|---------|
| [Next.js](https://nextjs.org/) 16 | App framework (App Router, API routes) |
| [React](https://react.dev/) 19 | UI |
| [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) | Google Gemini SDK |
| [unpdf](https://www.npmjs.com/package/unpdf) | PDF text extraction (serverless-safe) |
| [mammoth](https://www.npmjs.com/package/mammoth) | DOCX text extraction (client-side) |
| [Tailwind CSS](https://tailwindcss.com/) 4 | Styling |
| [shadcn/ui](https://ui.shadcn.com/) + Base UI | UI components |

### Development

| Package | Purpose |
|---------|---------|
| TypeScript 5 | Type checking |
| ESLint + `eslint-config-next` | Linting |

Install all dependencies with:

```bash
npm install
```

---

## Installation, Configuration & Local Run

Follow these steps in order from the project root.

### Step 1 — Clone the repository

```bash
git clone https://github.com/theme613/aic-intelligent-Recruiter.git
cd aic-intelligent-Recruiter
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs Next.js, React, Gemini SDK, PDF/DOCX parsers, and UI libraries into `node_modules/`.

### Step 3 — Configure environment variables

1. Copy the example env file:

   ```bash
   cp .env.example .env.local
   ```

   On Windows (PowerShell):

   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Open `.env.local` and set your Gemini API key:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Obtain a key (free tier available) from [Google AI Studio](https://aistudio.google.com/apikey).

> **Security:** Never commit `.env.local`. It is listed in `.gitignore`. Only `.env.example` (with placeholders) belongs in git.

> **Demo without a key:** Leave `GEMINI_API_KEY` empty or omit it. Use **LOAD DEMO** on the recruit dashboard, then **Analyze Candidates** — the app runs the built-in mock pipeline.

### Step 4 — Run the development server

```bash
npm run dev
```

### Step 5 — Open the application

| Page | URL |
|------|-----|
| Home | [http://localhost:3000](http://localhost:3000) |
| Recruitment workspace | [http://localhost:3000/recruit](http://localhost:3000/recruit) |

### Step 6 — Use the app (quick walkthrough)

1. Go to **http://localhost:3000/recruit**.
2. **JOB tab** — Fill in job title, company, skills, experience level, and job description → **Continue to Upload**.
3. **UPLOAD tab** — Upload resumes (PDF / TXT / DOCX) or paste text → **Analyze Candidates**.
4. **RESULTS tab** — View ranked candidates, hidden-gem badges, reasoning log, and export JSON.

**Shortcut:** Click **LOAD DEMO** in the header to pre-fill a sample job and four resumes, then analyze.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Production build |
| `npm run start` | Run production build locally (run `build` first) |
| `npm run lint` | Run ESLint |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No* | Google Gemini API key for live AI analysis |

\*Required only for real (non-demo) analysis. Demo mode works without it.

---

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add environment variable: `GEMINI_API_KEY` = your key.
4. Deploy.

`vercel.json` configures serverless function timeouts:

- `/api/analyze` — 60 seconds
- `/api/parse-pdf` — 30 seconds

> **Note:** Vercel **Hobby** plans limit function duration to ~10 seconds. Long Gemini runs may time out; use **demo mode** on Hobby or upgrade to **Pro** for 60s functions.

---

## Architecture

```
Browser (React)
  /              → Marketing home
  /recruit       → Dashboard (Job → Upload → Results)

API routes (Node.js serverless)
  POST /api/parse-pdf   → unpdf text extraction
  POST /api/analyze     → NDJSON stream (7-step agent or demo)

Agent pipeline (when GEMINI_API_KEY is set)
  Step 1  Parse job description        (Gemini 2.0 Flash)
  Step 2  Parse candidate resumes      (Gemini 2.0 Flash, parallel)
  Step 3  Vector / semantic search     (text-embedding-004)
  Step 4  Rule-based rerank            (TypeScript)
  Step 5  Hidden gem detection         (Gemini 2.5 Pro)
  Step 6  Generate pitches             (Gemini 2.5 Flash)
  Step 7  Draft outreach messages      (Gemini 2.5 Flash)
```

---

## Project Structure

```
src/
  app/
    page.tsx                    # Home
    recruit/page.tsx            # Recruitment dashboard
    api/
      analyze/route.ts          # AI analysis (streaming NDJSON)
      parse-pdf/route.ts        # PDF text extraction
  components/
    CandidateCard.tsx           # Result card + hidden gem UI
    FileUpload.tsx              # Resume upload
    JobForm.tsx                 # Job definition form
    ResultsPanel.tsx            # Results, stats, reasoning log
    SiteHeader.tsx
  lib/
    agent/                      # 7-step pipeline (orchestrator, steps 1–7)
    demoData.ts                 # Demo job, resumes, mock scores
    gemini.ts                   # API key helper
    vector.ts                   # Local cosine similarity fallback
    api-response.ts             # Safe JSON parsing for API errors
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `GEMINI_API_KEY is not configured` | Copy `.env.example` → `.env.local`, add key, restart `npm run dev` |
| `API key expired` / `API_KEY_INVALID` | Create a new key at [Google AI Studio](https://aistudio.google.com/apikey) |
| `Unexpected token '<'` after deploy | API returned HTML (404/timeout). Check Vercel logs; use demo mode on Hobby tier |
| PDF upload fails on Vercel | Redeploy with latest code (`unpdf` replaces `pdf-parse`) |
| Scanned PDF has no text | Use TXT/DOCX or paste resume text manually |

---

## Team

| Name | 
|------|
| Raymond | 


---

**Powered by [Google Gemini](https://ai.google.dev/)** · APU AIC branding accent `#7c3aed`
