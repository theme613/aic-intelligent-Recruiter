# AI Recruitment Agent

An intelligent recruitment web app that takes a job description and a pool of candidate resumes, then uses AI to semantically rank candidates and generate personalized **"Why this person?"** pitches, skills gap analysis, and outreach drafts.

Built for the APU AIC hackathon demo with **Chutes.AI** as the LLM provider.

## Features

- **Job intake** — Title, company, skills, experience level, and full job description
- **Resume upload** — Drag-and-drop PDF, TXT, and DOCX; manual paste supported
- **AI ranking** — Chutes.AI (DeepSeek-V3) scores each candidate 0–100
- **Local vector pre-sort** — Bag-of-words cosine similarity ranks candidates before LLM calls
- **Rich results** — Match badges, top skills, pitches, gaps, and LinkedIn outreach drafts
- **Demo mode** — Works offline without `CHUTES_API_KEY` via hardcoded mock results
- **Export** — Download ranked results as JSON

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| AI | [Chutes.AI](https://chutes.ai) (OpenAI-compatible API) |
| Vector search | Local cosine similarity (`src/lib/vector.ts`) |
| PDF parsing | pdf-parse |
| DOCX parsing | mammoth |
| Deployment | Vercel |

## Getting Started

### 1. Install dependencies

```bash
cd ai-recruiter
npm install
```

### 2. Environment variables

Copy `.env.local` and add your Chutes API key from [https://chutes.ai/app](https://chutes.ai/app):

```env
CHUTES_API_KEY=your_chutes_key_here
```

> **Demo without a key:** Click **Load Demo Data** on `/recruit`, then **Analyze Candidates**. The app returns mock results automatically when `CHUTES_API_KEY` is missing.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this project to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Set the root directory to `ai-recruiter` (if the repo contains other folders).
4. Add environment variable:
   - `CHUTES_API_KEY` = your key from Chutes.AI
5. Deploy.

`vercel.json` sets API route `maxDuration` to 30 seconds for analysis workloads.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React)                          │
│  /  Home          /recruit  Dashboard (Tabs: Job → Upload → Results) │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     POST /api/parse-pdf   mammoth (docx)  txt (client)
              │
              ▼
     POST /api/analyze
              │
     ┌────────┴────────┐
     │ CHUTES_API_KEY? │
     └────────┬────────┘
         no   │   yes
              ▼
    demoMockResults     cosine pre-sort → Chutes.AI per candidate
              │                    │
              └────────┬───────────┘
                       ▼
              Ranked JSON results → CandidateCard UI
```

## Project Structure

```
src/
  app/
    page.tsx                 # Home
    recruit/page.tsx         # Dashboard
    api/analyze/route.ts     # AI analysis
    api/parse-pdf/route.ts   # PDF text extraction
  components/
    CandidateCard.tsx
    FileUpload.tsx
    JobForm.tsx
    ResultsPanel.tsx
  lib/
    chutes.ts                # Chutes.AI client
    demoData.ts              # Demo job, resumes, mock scores
    vector.ts                # Cosine similarity
    utils.ts
```

## Team

| Name | Role |
|------|------|
| _Your Name_ | _Role_ |
| _Teammate_ | _Role_ |

---

**Powered by [Chutes.AI](https://chutes.ai)** · APU AIC branding accent `#7c3aed`
