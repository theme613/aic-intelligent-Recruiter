import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { HeroIllustration } from "@/components/HeroIllustration";
import { PillButton } from "@/components/PillButton";
import { SiteHeader } from "@/components/SiteHeader";
import { StatsBar } from "@/components/StatsBar";

const avatars = [
  "bg-[#E63946]",
  "bg-[#4A6FA5]",
  "bg-black",
  "bg-[#9ca3af]",
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        {/* Hero grid */}
        <section className="grid flex-1 grid-cols-1 lg:grid-cols-2">
          {/* Left — copy & CTA */}
          <div className="flex flex-col justify-between border-b border-black p-6 sm:p-10 lg:border-b-0 lg:border-r">
            <div>
              <Sparkles className="mb-8 size-5 text-black" strokeWidth={1.5} />

              <h1 className="max-w-xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                Intelligent recruiting for modern teams
              </h1>

              <p className="mt-6 max-w-md text-base leading-relaxed text-black/80 sm:text-lg">
                Explore AI-powered candidate matching with semantic scoring,
                dimension breakdowns, and personalized outreach — take hiring to
                the next level.
              </p>

              <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
                <PillButton href="/recruit">RECRUIT NOW</PillButton>

                <Link
                  href="/recruit?demo=1"
                  className="group flex items-center gap-3 text-sm font-medium tracking-wide"
                >
                  <span className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-black bg-[#e5e5e5] text-[10px] font-bold">
                    DEMO
                  </span>
                  <span className="flex items-center gap-1 border-b border-transparent group-hover:border-black">
                    VIEW DEMO
                    <ArrowUpRight className="size-3.5" />
                  </span>
                </Link>
              </div>
            </div>

            <p className="mt-12 text-sm text-black/70">
              <span className="text-[#E63946]">*</span> Free demo mode — no API
              key required for judges
            </p>
          </div>

          {/* Right — illustration */}
          <div className="border-b border-black lg:border-b-0">
            <HeroIllustration />
          </div>
        </section>

        {/* Stats bar */}
        <StatsBar
          items={[
            {
              content: (
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {avatars.map((bg, i) => (
                      <div
                        key={i}
                        className={`size-9 rounded-full border-2 border-white ${bg}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">3 demo candidates</span>
                </div>
              ),
              label: "ready to analyze instantly",
            },
            {
              content: (
                <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                  5{" "}
                  <span className="text-lg font-normal text-black/70">
                    scoring dimensions
                  </span>
                </p>
              ),
            },
            {
              content: (
                <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                  92%{" "}
                  <span className="text-lg font-normal text-black/70">
                    top match score
                  </span>
                </p>
              ),
            },
            {
              content: (
                <div className="flex flex-wrap items-center gap-6 text-sm font-bold tracking-widest text-black/60">
                  <span>GEMINI</span>
                  <span>NEXT.JS</span>
                  <span>VERCEL</span>
                </div>
              ),
              label: "Powered by Google Gemini",
            },
          ]}
        />

        {/* Features — ABOUT anchor */}
        <section
          id="features"
          className="grid grid-cols-1 border-t border-black sm:grid-cols-3"
        >
          {[
            {
              title: "Semantic Match",
              desc: "AI scores resumes against your job description across five dimensions.",
            },
            {
              title: "Smart Pitches",
              desc: "Personalized “Why this person?” evidence and interview probes.",
            },
            {
              title: "Outreach Ready",
              desc: "Draft LinkedIn messages and copy to clipboard in one click.",
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className="border-b border-black p-8 sm:border-b-0 sm:border-r sm:last:border-r-0"
            >
              <h3 className="text-sm font-bold tracking-[0.15em]">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-black/70">
                {item.desc}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
