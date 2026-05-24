import type { CandidateAnalysis } from "@/lib/gemini";
import { computeOverallScore } from "@/lib/gemini";

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

export const demoCandidates = [
  {
    name: "Sarah Chen",
    resumeText: `Sarah Chen
Frontend Engineer | sarah.chen@email.com

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
];

const sarahDimensions = {
  skillScore: 96,
  experienceScore: 90,
  domainScore: 88,
  seniorityScore: 85,
  outreachScore: 82,
};

const marcusDimensions = {
  skillScore: 72,
  experienceScore: 68,
  domainScore: 55,
  seniorityScore: 70,
  outreachScore: 65,
};

const davidDimensions = {
  skillScore: 28,
  experienceScore: 62,
  domainScore: 35,
  seniorityScore: 45,
  outreachScore: 40,
};

export const demoMockResults: CandidateAnalysis[] = [
  {
    name: "Sarah Chen",
    ...sarahDimensions,
    score: computeOverallScore(sarahDimensions),
    matchedSkills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "REST APIs"],
    missingSkills: [],
    keyStrengths: [
      "Led Next.js App Router migration for a production customer dashboard at CloudStack",
      "Built a Tailwind-based design system used across multiple product surfaces",
      "Improved Lighthouse performance scores by 35% on React/TypeScript SPAs at WebForge",
    ],
    whyThisPerson:
      "Sarah brings four years of production React and Next.js experience, including an App Router migration that mirrors our stack. Her TypeScript and Tailwind work on a design system shows she can ship polished UI at pace.",
    skillsGap:
      "Could deepen GraphQL exposure if we expand beyond REST, though her API integration background is already strong.",
    interviewFocus:
      "Walk me through how you structured the App Router migration — what broke, what you measured, and how you kept releases safe.",
    outreachMessage:
      "Hi Sarah — I came across your CloudStack work on Next.js and Tailwind. We're hiring a Frontend Developer at APU AIC Labs on a similar stack. Would you be open to a quick chat this week?",
    summary: "Strong frontend specialist with React, TypeScript, and Next.js leadership experience.",
  },
  {
    name: "Marcus Rivera",
    ...marcusDimensions,
    score: computeOverallScore(marcusDimensions),
    matchedSkills: ["React", "Next.js"],
    missingSkills: ["TypeScript", "Tailwind CSS", "REST APIs"],
    keyStrengths: [
      "Shipped internal React + Next.js tools at DataPulse over 3+ years",
      "Comfortable connecting frontends to Node.js/MongoDB backends for full-stack delivery",
      "Maintained and modernized legacy React/jQuery hybrid apps at StartupHub",
    ],
    whyThisPerson:
      "Marcus has solid React and Next.js delivery experience and understands full-stack context. He could ramp on TypeScript and Tailwind with mentorship given his JavaScript foundation.",
    skillsGap:
      "Needs structured TypeScript adoption and more consistent Tailwind/CSS system work before matching senior UI expectations.",
    interviewFocus:
      "How are you adopting TypeScript today, and what would your 30-day plan look like to reach production-grade type safety on our stack?",
    outreachMessage:
      "Hi Marcus — your Next.js projects at DataPulse caught my eye. We're looking for a mid-level frontend dev at APU AIC Labs. Interested in learning more about a role where you'd grow TypeScript skills?",
    summary: "Capable React/Next.js developer — strong skills, weaker SaaS frontend domain fit.",
  },
  {
    name: "David Okonkwo",
    ...davidDimensions,
    score: computeOverallScore(davidDimensions),
    matchedSkills: [],
    missingSkills: [
      "React",
      "TypeScript",
      "Next.js",
      "Tailwind CSS",
      "REST APIs",
    ],
    keyStrengths: [
      "Designed Python/Django microservices and PostgreSQL clusters at FinServe",
      "Deployed containerized workloads on AWS ECS with Docker",
      "Built ETL pipelines and batch systems with measurable data throughput gains",
    ],
    whyThisPerson:
      "David is a strong backend engineer but his profile centers on Python, Django, and infrastructure rather than modern frontend frameworks required for this role.",
    skillsGap:
      "Would need significant upskilling in React, TypeScript, and component-driven UI before being competitive for this frontend position.",
    interviewFocus:
      "Have you shipped any user-facing UI in the last two years — if we paired you with a frontend lead, how would you close framework gaps in 60 days?",
    outreachMessage:
      "Hi David — thank you for your interest. This role is frontend-focused; I'd be happy to keep you in mind for backend openings that match your Python and cloud background.",
    summary: "Experienced backend engineer — deep systems experience, minimal frontend alignment.",
  },
];

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
    demoMockResults.find(
      (m) => m.name.toLowerCase() === candidate.name.toLowerCase(),
    ) ?? demoMockResults[index % demoMockResults.length];
  return { ...mock, name: candidate.name || mock.name };
}
