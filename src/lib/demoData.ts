import type { CandidateAnalysis } from "@/lib/gemini";
import type { FactCheckReport, JobRequirements, TrustSignal } from "@/lib/agent/types";

export const demoJob = {
  jobTitle: "Frontend Developer",
  company: "APU AIC Labs",
  requiredSkills: "React, TypeScript, Next.js, Tailwind CSS, REST APIs",
  experienceLevel: "Mid",
  jobDescription: `We are looking for a Frontend Developer to build modern, responsive web applications.

Responsibilities:
- Develop user-facing features with React and Next.js
- Write type-safe TypeScript and collaborate on API integration
- Implement polished UI with Tailwind CSS and accessible components
- Partner with design and backend teams on end-to-end delivery

Requirements:
- 2+ years experience with React and TypeScript
- Experience with Next.js App Router
- Strong CSS skills (Tailwind preferred)
- Familiarity with REST APIs and Git workflows`,
};

export const demoJobRequirements: JobRequirements = {
  role_title: "Frontend Developer",
  seniority_level: "mid",
  hard_skills: ["react", "typescript", "next.js", "tailwind css", "rest apis"],
  soft_skills: ["graphql", "jest", "accessibility", "design systems"],
  domain: "saas",
  responsibilities: [
    "Build user-facing features with React and Next.js App Router",
    "Write type-safe TypeScript and integrate REST APIs",
    "Implement polished UI with Tailwind CSS",
    "Collaborate with design and backend on end-to-end delivery",
  ],
  hard_constraints: [],
  title_keywords: ["frontend", "developer", "engineer"],
};

export const demoCandidates = [
  {
    name: "Sarah Chen",
    resumeText: `Sarah Chen
Frontend Engineer | sarah.chen@email.com | github.com/sarah-chen-dev | linkedin.com/in/sarahchendev

SUMMARY
Frontend developer with 4 years building React and Next.js applications for SaaS products.

SKILLS
React, TypeScript, Next.js, Tailwind CSS, REST APIs, GraphQL, Jest, Git

EXPERIENCE
Senior Frontend Developer — CloudStack Inc (2022–Present)
- Led migration to Next.js App Router for customer dashboard
- Built design system components with Tailwind CSS
- Integrated REST and GraphQL APIs with React Query

Frontend Developer — WebForge (2020–2022)
- Developed responsive SPAs in React and TypeScript
- Improved Lighthouse performance scores by 35%

EDUCATION
B.S. Computer Science — Arizona State University`,
  },
  {
    name: "Marcus Rivera",
    resumeText: `Marcus Rivera
Software Developer | marcus.r@email.com

SUMMARY
Full-stack developer with strong JavaScript and React experience, learning TypeScript on current role.

SKILLS
React, JavaScript, Next.js, CSS, HTML, Node.js, MongoDB, Git

EXPERIENCE
Software Developer — DataPulse (2021–Present)
- Built internal tools with React and Next.js pages router
- Styled applications with CSS modules and some Tailwind
- Connected Node.js backends to MongoDB

Junior Developer — StartupHub (2019–2021)
- Maintained legacy jQuery and React hybrid apps

EDUCATION
B.A. Information Technology`,
  },
  {
    name: "David Okonkwo",
    resumeText: `David Okonkwo
Backend Engineer | david.okonkwo@email.com

SUMMARY
Backend-focused engineer specializing in distributed systems and databases.

SKILLS
Python, Django, PostgreSQL, Redis, Docker, Kubernetes, AWS, Java

EXPERIENCE
Backend Engineer — FinServe (2020–Present)
- Designed microservices in Python and Django
- Managed PostgreSQL clusters and Redis caching layers
- Deployed services on AWS ECS with Docker

Systems Developer — Enterprise Corp (2018–2020)
- Built ETL pipelines and Java batch jobs

EDUCATION
M.S. Software Engineering`,
  },
  {
    name: "Jordan Kim",
    resumeText: `Jordan Kim
UI/UX Designer | jordan.kim@email.com | github.com/jordankim-ui | linkedin.com/in/jordankimdesign | jordankim.design

SUMMARY
Product designer who ships production React code — not just mockups. 3 years building customer-facing dashboards and design systems in code.

SKILLS
React, TypeScript, Next.js, Tailwind CSS, Figma, REST APIs, Storybook, Git

EXPERIENCE
Senior Product Designer — PayFlow (2022–Present)
- Shipped React + TypeScript customer analytics dashboard used by 40k merchants
- Led Next.js App Router prototype that became production billing UI
- Built Tailwind component library adopted by 3 engineering squads
- Integrated REST APIs for live transaction previews in design QA

Product Designer — Creative Labs (2020–2022)
- Coded responsive React prototypes that reduced handoff cycles by 50%
- Improved Lighthouse accessibility scores from 62 to 94 on marketing site

EDUCATION
B.Des Interaction Design — RMIT`,
  },
];

// ── Demo fact check reports ───────────────────────────────────────────────

const sarahFactCheck: FactCheckReport = {
  overallVeracity: "high",
  summary: "Resume is internally consistent. Both employers verified in public records.",
  consistencyFlags: [],
  companyChecks: [
    {
      name: "CloudStack Inc",
      dates: "2022–Present",
      status: "confirmed",
      domain: "cloudstack.com",
      website: "https://cloudstack.com",
      contactPage: "https://cloudstack.com/contact",
      note: "Confirmed — CloudStack Inc (cloudstack.com) found in public records.",
    },
    {
      name: "WebForge",
      dates: "2020–2022",
      status: "likely",
      domain: "webforge.io",
      website: "https://webforge.io",
      contactPage: "https://webforge.io/contact",
      note: "Likely match: WebForge (webforge.io) — verify it is the same company.",
    },
  ],
};

const jordanFactCheck: FactCheckReport = {
  overallVeracity: "medium",
  summary: "Minor flag on experience timeline — worth a quick clarification in interview. PayFlow verified.",
  consistencyFlags: [
    {
      severity: "info",
      claim: "3 years building customer-facing dashboards",
      reason: "Resume shows 2 roles from 2020 to present — timeline is plausible but total coding experience may include design-only periods.",
    },
  ],
  companyChecks: [
    {
      name: "PayFlow",
      dates: "2022–Present",
      status: "confirmed",
      domain: "payflow.com",
      website: "https://payflow.com",
      contactPage: "https://payflow.com/contact",
      note: "Confirmed — PayFlow (payflow.com) found in public records.",
    },
    {
      name: "Creative Labs",
      dates: "2020–2022",
      status: "not_found",
      note: "\"Creative Labs\" not found in public company registry. Call their HR to verify — search \"Creative Labs careers\" for contact details.",
    },
  ],
};

const marcusFactCheck: FactCheckReport = {
  overallVeracity: "medium",
  summary: "One employer unverified. Consider asking for a reference before progressing.",
  consistencyFlags: [
    {
      severity: "info",
      claim: "learning TypeScript on current role",
      reason: "JD requires TypeScript — confirm current proficiency level and timeline to production-ready.",
    },
  ],
  companyChecks: [
    {
      name: "DataPulse",
      dates: "2021–Present",
      status: "not_found",
      note: "\"DataPulse\" not found in public company registry. Call their HR to verify — search \"DataPulse careers\" for contact details.",
    },
    {
      name: "StartupHub",
      dates: "2019–2021",
      status: "skipped",
      note: "Self-reported / generic employer — no lookup needed.",
    },
  ],
};

const davidFactCheck: FactCheckReport = {
  overallVeracity: "high",
  summary: "Resume is internally consistent. Backend experience is well-documented.",
  consistencyFlags: [],
  companyChecks: [
    {
      name: "FinServe",
      dates: "2020–Present",
      status: "confirmed",
      domain: "finserve.com",
      website: "https://finserve.com",
      contactPage: "https://finserve.com/contact",
      note: "Confirmed — FinServe (finserve.com) found in public records.",
    },
    {
      name: "Enterprise Corp",
      dates: "2018–2020",
      status: "likely",
      domain: "enterprisecorp.com",
      website: "https://enterprisecorp.com",
      contactPage: "https://enterprisecorp.com/contact",
      note: "Likely match: Enterprise Corp (enterprisecorp.com) — verify it is the same company.",
    },
  ],
};

const sarahTrust: TrustSignal[] = [
  {
    status: "verified",
    label: "GitHub verified (34 public repos)",
    detail: "12 followers · active in last 6 months",
    url: "https://github.com/sarah-chen-dev",
  },
  {
    status: "verified",
    label: "3 skills confirmed via GitHub",
    detail: "react, typescript, next.js — matching repos found",
    url: "https://github.com/sarah-chen-dev",
  },
  {
    status: "verified",
    label: "Top project: cloudstack-dashboard ★8",
    detail: "Next.js App Router dashboard with Tailwind design system (TypeScript)",
    url: "https://github.com/sarah-chen-dev/cloudstack-dashboard",
  },
  {
    status: "partial",
    label: "LinkedIn provided",
    detail: "Employment history requires manual verification.",
    url: "https://linkedin.com/in/sarahchendev",
  },
];

const jordanTrust: TrustSignal[] = [
  {
    status: "verified",
    label: "GitHub verified (22 public repos)",
    detail: "38 followers · active in last 6 months",
    url: "https://github.com/jordankim-ui",
  },
  {
    status: "verified",
    label: "5 skills confirmed via GitHub",
    detail: "react, typescript, next.js, tailwind css, javascript — matching repos found",
    url: "https://github.com/jordankim-ui",
  },
  {
    status: "verified",
    label: "Top project: payflow-analytics ★19",
    detail: "React + TypeScript analytics dashboard — 40k merchant production app",
    url: "https://github.com/jordankim-ui/payflow-analytics",
  },
  {
    status: "partial",
    label: "Portfolio link found",
    detail: "Visit to assess design / project quality.",
    url: "https://jordankim.design",
  },
  {
    status: "partial",
    label: "LinkedIn provided",
    detail: "Employment history requires manual verification.",
    url: "https://linkedin.com/in/jordankimdesign",
  },
];

const marcusTrust: TrustSignal[] = [
  {
    status: "unverified",
    label: "No public GitHub found",
    detail: "Skills and experience are self-reported only — no public code to verify.",
  },
  {
    status: "partial",
    label: "LinkedIn provided",
    detail: "Employment history requires manual verification.",
    url: "https://linkedin.com/in/marcusrivera",
  },
];

const davidTrust: TrustSignal[] = [
  {
    status: "unverified",
    label: "No public GitHub found",
    detail: "Skills and experience are self-reported only — no public code to verify.",
  },
];

const demoMock: CandidateAnalysis[] = [
  {
    name: "Sarah Chen",
    currentTitle: "Senior Frontend Developer",
    score: 91,
    semanticScore: 0.92,
    skillScore: 96,
    experienceScore: 90,
    domainScore: 88,
    seniorityScore: 85,
    outreachScore: 82,
    isHiddenGem: false,
    matchedSkills: ["react", "typescript", "next.js", "tailwind css", "rest apis"],
    missingSkills: [],
    keyStrengths: [
      "Led Next.js App Router migration for production customer dashboard at CloudStack",
      "Built Tailwind design system used across product surfaces",
      "Improved Lighthouse scores by 35% on React/TypeScript SPAs",
    ],
    whyThisPerson:
      "Sarah has four years shipping React and Next.js for SaaS products, including an App Router migration that mirrors this role exactly. Her Tailwind design-system work and REST/GraphQL integration show she can own polished UI delivery end-to-end.",
    skillsGap:
      "GraphQL is listed as preferred rather than required — she has exposure but the JD centers on REST.",
    interviewFocusAreas: [
      "Walk through the App Router migration — what broke, metrics you tracked, and release safety.",
      "How did you structure the Tailwind design system for cross-team adoption?",
      "Describe a performance win with measurable before/after (e.g. Lighthouse).",
    ],
    interviewFocus:
      "Walk through the App Router migration. How did you structure the Tailwind design system? Describe a performance win with measurable before/after.",
    outreachMessage:
      "Hi Sarah — I was impressed by your CloudStack work leading a Next.js App Router migration and building a Tailwind design system. We're hiring a Frontend Developer at APU AIC Labs on a very similar React/TypeScript stack. Your SaaS dashboard experience looks like a strong match. Would you be open to a quick chat this week?",
    summary:
      "Sarah has four years shipping React and Next.js for SaaS products, including an App Router migration that mirrors this role exactly.",
    flags: [],
    trustSignals: sarahTrust,
    factCheck: sarahFactCheck,
    githubUrl: "https://github.com/sarah-chen-dev",
    linkedinUrl: "https://linkedin.com/in/sarahchendev",
    githubTopRepos: [
      { name: "cloudstack-dashboard", url: "https://github.com/sarah-chen-dev/cloudstack-dashboard", language: "TypeScript", stars: 8, description: "Next.js App Router dashboard with Tailwind design system" },
      { name: "react-component-lib", url: "https://github.com/sarah-chen-dev/react-component-lib", language: "TypeScript", stars: 4, description: "Reusable React component library" },
    ],
  },
  {
    name: "Jordan Kim",
    currentTitle: "UI/UX Designer",
    score: 86,
    semanticScore: 0.89,
    skillScore: 92,
    experienceScore: 88,
    domainScore: 85,
    seniorityScore: 78,
    outreachScore: 80,
    isHiddenGem: true,
    hiddenGemReason:
      "Ranked low because title says UI/UX Designer, but promoted because shipped production React + TypeScript dashboard for 40k merchants, led Next.js App Router billing UI, and built Tailwind library adopted by 3 engineering squads",
    hiddenGemStory:
      "Title said UI/UX Designer. Work said Frontend Developer. We promoted them.",
    matchedSkills: ["react", "typescript", "next.js", "tailwind css", "rest apis"],
    missingSkills: [],
    keyStrengths: [
      "Shipped React + TypeScript analytics dashboard for 40k merchants at PayFlow",
      "Led Next.js App Router prototype that became production billing UI",
      "Built Tailwind component library adopted by 3 engineering squads",
    ],
    whyThisPerson:
      "Jordan's title says designer, but the resume reads like a frontend engineer: production React dashboards, a Next.js App Router billing UI, and a Tailwind system used by multiple squads. Traditional keyword filters would have skipped this profile entirely.",
    skillsGap:
      "Formal engineering title is missing — validate depth on testing, CI/CD, and large-scale refactors in interview.",
    interviewFocusAreas: [
      "What percentage of your week is hands-on React/TypeScript vs. Figma — show a recent PR you merged.",
      "How did the Next.js billing UI prototype move from design to production release?",
      "Describe how you integrated REST APIs during design QA at PayFlow.",
    ],
    interviewFocus:
      "What percentage of your week is hands-on React/TypeScript vs. Figma? How did the Next.js billing UI move to production?",
    outreachMessage:
      "I almost missed your profile — your title didn't match, but your work did. Hi Jordan — your PayFlow dashboard shipped in React and TypeScript for 40k merchants, which is exactly the kind of end-to-end frontend ownership we need. We're hiring a Frontend Developer at APU AIC Labs and your Next.js billing UI + Tailwind system work stood out immediately. Would love to chat for 15 minutes this week if you're open to it.",
    summary:
      "Title said UI/UX Designer. Work said Frontend Developer. We promoted them.",
    flags: ["hidden_gem", "title_mismatch"],
    trustSignals: jordanTrust,
    factCheck: jordanFactCheck,
    githubUrl: "https://github.com/jordankim-ui",
    linkedinUrl: "https://linkedin.com/in/jordankimdesign",
    portfolioUrl: "https://jordankim.design",
    githubTopRepos: [
      { name: "payflow-analytics", url: "https://github.com/jordankim-ui/payflow-analytics", language: "TypeScript", stars: 19, description: "React + TypeScript analytics dashboard for 40k merchants" },
      { name: "tailwind-system", url: "https://github.com/jordankim-ui/tailwind-system", language: "CSS", stars: 11, description: "Tailwind component library adopted across 3 engineering squads" },
      { name: "nextjs-billing-ui", url: "https://github.com/jordankim-ui/nextjs-billing-ui", language: "TypeScript", stars: 6, description: "Next.js App Router billing UI prototype" },
    ],
  },
  {
    name: "Marcus Rivera",
    currentTitle: "Software Developer",
    score: 66,
    semanticScore: 0.72,
    skillScore: 72,
    experienceScore: 68,
    domainScore: 55,
    seniorityScore: 70,
    outreachScore: 65,
    isHiddenGem: false,
    matchedSkills: ["react", "next.js"],
    missingSkills: ["typescript", "tailwind css", "rest apis"],
    keyStrengths: [
      "3+ years React/Next.js internal tools at DataPulse",
      "Full-stack delivery with Node.js backends",
    ],
    whyThisPerson:
      "Marcus has three years delivering React and Next.js internal tools with credible full-stack context. He could ramp on TypeScript and Tailwind with mentorship.",
    skillsGap:
      "TypeScript and Tailwind are thin on the resume — mostly CSS modules today.",
    interviewFocusAreas: [
      "What is your TypeScript adoption plan in production today?",
      "Show a component you built with clear ownership and user impact metrics.",
      "How would you move from pages router to App Router?",
    ],
    interviewFocus: "TypeScript adoption plan. Component ownership. App Router migration path.",
    outreachMessage:
      "Hi Marcus — your React and Next.js work at DataPulse stood out. We're looking for a mid-level frontend developer at APU AIC Labs where you'd grow TypeScript and Tailwind on a modern stack. Interested in a short intro call?",
    summary:
      "Marcus has three years delivering React and Next.js internal tools with credible full-stack context.",
    flags: [],
    trustSignals: marcusTrust,
    factCheck: marcusFactCheck,
    linkedinUrl: "https://linkedin.com/in/marcusrivera",
  },
  {
    name: "David Okonkwo",
    currentTitle: "Backend Engineer",
    score: 38,
    semanticScore: 0.41,
    skillScore: 28,
    experienceScore: 62,
    domainScore: 35,
    seniorityScore: 45,
    outreachScore: 40,
    isHiddenGem: false,
    matchedSkills: [],
    missingSkills: ["react", "typescript", "next.js", "tailwind css", "rest apis"],
    keyStrengths: [
      "Python/Django microservices and PostgreSQL at FinServe",
      "AWS ECS + Docker production deployments",
    ],
    whyThisPerson:
      "David is a capable backend engineer, but his resume shows minimal modern frontend framework work required for this role.",
    skillsGap:
      "No evidence of React, TypeScript, Next.js, or Tailwind.",
    interviewFocusAreas: [
      "Have you shipped any user-facing UI in the last two years?",
      "Are you intentionally pivoting to frontend?",
    ],
    interviewFocus: "Any user-facing UI shipped recently? Pivoting to frontend?",
    outreachMessage:
      "Hi David — your microservices experience at FinServe is strong, though this opening is frontend-focused on React/TypeScript. I'd like to stay in touch for backend roles that fit your Python and cloud background.",
    summary:
      "David is a capable backend engineer with strong Python and cloud infrastructure experience.",
    flags: ["seniority_mismatch"],
    trustSignals: davidTrust,
    factCheck: davidFactCheck,
  },
];

export const demoMockResults: CandidateAnalysis[] = demoMock;

export const DEMO_HIDDEN_GEM_NAME = "Jordan Kim";

export function parseRequiredSkills(skills: string): string[] {
  return skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function resolveDemoResult(
  candidate: { name: string },
  index: number,
): CandidateAnalysis {
  const mock =
    demoMock.find(
      (m) => m.name.toLowerCase() === candidate.name.toLowerCase(),
    ) ?? demoMock[index % demoMock.length];
  return { ...mock, name: candidate.name || mock.name };
}

export function countDemoHiddenGems(results: CandidateAnalysis[]): number {
  return results.filter((r) => r.isHiddenGem).length;
}
