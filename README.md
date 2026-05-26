# AI Intelligent Recruiter

An intelligent recruitment web application for **hiring teams**. It ingests a job description and a pool of resumes, then runs a **9-step orchestrated AI pipeline** (Google Gemini + external verification APIs) to rank candidates, **verify claims**, detect **hidden gems**, and generate recruiter-ready outputs: fit summaries, gap analysis, **interview questions to ask**, trust signals, and outreach drafts.

Built for the **APU AIC** hackathon.

> **Architecture note:** This is a **single orchestrator** running a fixed multi-step workflow — not a multi-agent system (no separate agents delegating to each other).

---

## Repository

**Public repository:** [https://github.com/theme613/aic-intelligent-Recruiter](https://github.com/theme613/aic-intelligent-Recruiter)

---

## Features

| Feature | Description |
|---------|-------------|
| **Job intake** | Title, company, skills, experience level, full job description |
| **Resume upload** | Drag-and-drop **PDF**, **TXT**, **DOCX**; manual text paste |
| **9-step AI pipeline** | Parse JD → parse resumes → GitHub verify → fact check → semantic rank → rule rerank → hidden gems → pitches → outreach |
| **GitHub trust signals** | Fetches public repos/languages/activity; cross-checks claimed skills (✅ / ⚠️ / ❌) |
| **Fact check** | AI consistency scan + employer lookup via Clearbit (contact links when unknown) |
| **Hidden Gem Detector** | Promotes strong candidates missed by title/keyword bias (e.g. designer with React production work) |
| **Recruiter interview guide** | Probing questions for **HR to ask the candidate** (not coaching for applicants) |
| **Streaming results** | Live reasoning log and progressive candidate cards |
| **Demo mode** | Full UI without `GEMINI_API_KEY` using built-in sample data |
| **Export** | Download ranked results as JSON |

---

## vs Traditional ATS

| Traditional ATS / Job Board | RecruitAI Agent |
|-----------------------------|-----------------|
| Keyword filter only | Semantic AI understanding |
| HR reads 100 resumes manually | Top 5 shortlisted in seconds |
| No claim verification | GitHub + fact-check trust signals |
| Rejects non-traditional candidates | Hidden gem detection |
| Generic accept/reject | Personalised "Why this person" pitch |
| No outreach help | LinkedIn message drafted instantly |

---

## Agent pipeline (9 steps)

Flow: **`1 → 2 → 2.5 → 2.6 → 3 → 4 → 5 → 6 → 7`**

Steps **2**, **2.5**, and **2.6** each process **all candidates in parallel** (`Promise.all`). Those three steps run **sequentially** (not in parallel with each other).

| Step | Name | What it does | Technology |
|------|------|--------------|------------|
| **1** | Parse JD | Extract role, skills, seniority, constraints, title keywords | Gemini 2.0 Flash |
| **2** | Parse candidates | Normalize each resume to structured JSON | Gemini 2.0 Flash (parallel) |
| **2.5** | GitHub enrichment & trust signals | Extract profile URLs → fetch repos/languages/activity → trust signals | GitHub REST API (no auth) |
| **2.6** | Fact check | Resume consistency scan + employer verification | Gemini 2.0 Flash + Clearbit API |
| **3** | Vector search | Embed JD vs candidates → cosine semantic score | text-embedding-004 |
| **4** | Rule-based rerank | Hard constraints, seniority/domain weights, final score | TypeScript |
| **5** | Hidden gem detection | Promote title-mismatch but strong-fit candidates into top 5 | Gemini 2.5 Pro |
| **6** | Generate pitches | Fit summary, gap analysis, **questions for interviewer**, 5-dimension scores | Gemini 2.5 Flash |
| **7** | Draft outreach | Personalized message per shortlisted candidate | Gemini 2.5 Flash |

**Output:** Ranked shortlist (≤5) + reasoning log + trust signals + fact-check report + pitches + outreach (streamed to UI).

---

## System Requirements

| Requirement | Minimum |
|-------------|---------|
| **Node.js** | 20.x or later (22.x recommended) |
| **npm** | 10.x or later (ships with Node.js) |
| **OS** | Windows 10+, macOS 12+, or Linux |
| **RAM** | 4 GB+ for local development |
| **Disk** | ~500 MB for `node_modules` |
| **Browser** | Modern Chromium, Firefox, or Safari |
| **Internet** | Required for Gemini API calls (not required for demo mode) |

### Optional (for deployment)

- [Vercel](https://vercel.com) account (recommended hosting)
- [Google AI Studio](https://aistudio.google.com/apikey) API key for live AI analysis

---

## Dependencies

### Runtime

| Package | Purpose |
|---------|---------|
| [Next.js](https://nextjs.org/) 16 | App Router, API routes, deployment |
| [React](https://react.dev/) 19 | UI |
| [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) | Google Gemini SDK |
| [unpdf](https://www.npmjs.com/package/unpdf) | PDF text extraction (serverless-safe) |
| [mammoth](https://www.npmjs.com/package/mammoth) | DOCX parsing (client-side) |
| [Tailwind CSS](https://tailwindcss.com/) 4 + [shadcn/ui](https://ui.shadcn.com/) | Styling & components |

### Development

TypeScript 5, ESLint, `eslint-config-next`

```bash
npm install
```

---

## Installation, configuration & local run

### 1. Clone the repository

```bash
git clone https://github.com/theme613/aic-intelligent-Recruiter.git
cd aic-intelligent-Recruiter
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Windows (PowerShell):

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here

# Optional fallback providers — used automatically when Gemini is rate-limited
GROQ_API_KEY=
MISTRAL_API_KEY=
OPENROUTER_API_KEY=
```

Get keys from:
- [Google AI Studio](https://aistudio.google.com/apikey) — Gemini
- [Groq Console](https://console.groq.com/keys) — Groq (recommended fallback, very generous free tier)
- [Mistral Console](https://console.mistral.ai/api-keys) — Mistral AI
- [OpenRouter](https://openrouter.ai/keys) — aggregator with free models

The pipeline tries providers in order **Gemini → Groq → Mistral → OpenRouter** and falls through automatically on rate-limit / quota errors. Only Gemini is strictly required; the others act as resilience.

> **Security:** Never commit `.env.local`. Only `.env.example` (placeholders) belongs in git.

> **Demo without a key:** Leave all provider keys empty. On `/recruit`, click **LOAD DEMO**, then **Analyze Candidates**.

### 4. Run the development server

```bash
npm run dev
```

### 5. Open the application

| Page | URL |
|------|-----|
| Home | [http://localhost:3000](http://localhost:3000) |
| Recruitment workspace | [http://localhost:3000/recruit](http://localhost:3000/recruit) |

### 6. Quick walkthrough

1. **JOB** — Enter role details and job description → continue to upload.
2. **UPLOAD** — Add resumes (PDF / TXT / DOCX) or paste text → **Analyze Candidates**.
3. **RESULTS** — Review ranked cards with:
   - Match score and 5-dimension breakdown
   - **Trust signals** (GitHub-verified skills, activity)
   - **Fact check** (consistency flags, employer verification)
   - **Interview questions** — scripts for the hiring team to ask in interview
   - Outreach draft (copy for LinkedIn/email)

**Shortcut:** **LOAD DEMO** pre-fills a sample job and four candidates.

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (hot reload) |
| `npm run build` | Production build |
| `npm run start` | Run production build (run `build` first) |
| `npm run lint` | ESLint |

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No* | Google Gemini API key — primary provider |
| `GROQ_API_KEY` | No | Groq API key — fallback provider, very fast inference |
| `MISTRAL_API_KEY` | No | Mistral AI API key — fallback provider |
| `OPENROUTER_API_KEY` | No | OpenRouter API key — final fallback (aggregator) |
| `OPENROUTER_REFERER` | No | OpenRouter analytics: site URL (optional) |
| `OPENROUTER_TITLE` | No | OpenRouter analytics: site title (optional) |
| `GEMINI_CONCURRENCY` | No | Max concurrent LLM calls. Default `1` (sequential) |

\*Required only for real (non-demo) runs. The pipeline calls providers in the order `Gemini → Groq → Mistral → OpenRouter` and falls through automatically when one is rate-limited.

---

## Deploy to Vercel

1. Push to GitHub.
2. Import at [vercel.com/new](https://vercel.com/new).
3. Set `GEMINI_API_KEY` in project environment variables.
4. Deploy.

`vercel.json` function timeouts:

- `/api/analyze` — 60 seconds
- `/api/parse-pdf` — 30 seconds

> **Hobby plan:** Serverless functions are capped at ~10s. Long Gemini runs may time out — use **demo mode** or upgrade to **Pro** for 60s functions.

---

## Architecture

```
Browser (React)
  /              → Marketing home
  /recruit       → Dashboard (Job → Upload → Results)

API routes (Node.js)
  POST /api/parse-pdf   → unpdf text extraction
  POST /api/analyze     → NDJSON stream (pipeline or demo)

Pipeline (src/lib/agent/orchestrator.ts)
  runAgent() → steps 1–7 + 2.5 + 2.6 → stream events to UI
```

---

## Project structure

```
src/
  app/
    page.tsx                      # Home
    recruit/page.tsx              # Recruitment dashboard
    api/
      analyze/route.ts              # Streaming analysis
      parse-pdf/route.ts            # PDF extraction
  components/
    CandidateCard.tsx               # Scores, trust signals, fact check, outreach
    FileUpload.tsx
    JobForm.tsx
    ResultsPanel.tsx
    SiteHeader.tsx
  lib/
    agent/
      orchestrator.ts               # Pipeline controller
      step1-parse-jd.ts
      step2-parse-candidates.ts
      github-enrichment.ts          # Step 2.5
      fact-check.ts                 # Step 2.6
      step3-vector-search.ts
      step4-rerank.ts
      step5-hidden-gem.ts
      step6-pitches.ts
      step7-outreach.ts
      llm.ts                        # Per-step Gemini models
      prompts.ts
      types.ts
    demoData.ts
    gemini.ts                       # UI types + API key check
    api-response.ts                 # Safe JSON error handling
```

---

## Testing fact check & trust signals

Use resumes that exercise different paths:

| Scenario | What to include | Expected result |
|----------|-----------------|-----------------|
| **Clean** | Real company names, consistent dates, `github.com/username` | High veracity, GitHub verified |
| **Timeline bug** | "8 years experience" + graduated 2023 | Consistency warning |
| **Fake employer** | Fictional company (e.g. "Zorblax Digital") | Employer **not found** — manual verify link |
| **No GitHub** | Strong skills, no profile URL | "No public GitHub found" |
| **Hidden gem** | Title "Designer" + React/Next.js project bullets + GitHub | Hidden gem promotion + trust signals |

**Resume format tip** (helps employer extraction):

```
Job Title — Company Name (2020–2024)
```

Use en-dash in dates: `2020–Present`.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `GEMINI_API_KEY is not configured` | Copy `.env.example` → `.env.local`, add key, restart `npm run dev` |
| `API key expired` / `API_KEY_INVALID` | New key from [Google AI Studio](https://aistudio.google.com/apikey) |
| `Unexpected token '<'` after deploy | API returned HTML (404/timeout). Check Vercel logs; try demo mode on Hobby |
| PDF upload fails on Vercel | Ensure latest code uses `unpdf` (not `pdf-parse`) |
| Scanned PDF has no text | Use TXT/DOCX or paste text manually |
| GitHub shows no data | Profile must be public; URL must be `github.com/username` on resume |
| Employer not found | Expected for fictional companies — use fact-check contact guidance |

---

## Team

| Name |
|------|
| Raymond |

---

**Powered by [Google Gemini](https://ai.google.dev/)** · APU AIC branding accent `#7c3aed`
