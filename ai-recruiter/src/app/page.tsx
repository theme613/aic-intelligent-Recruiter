import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1 text-sm text-violet-300">
          APU AIC Hackathon Demo
        </div>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            AI Recruitment
          </span>
          <br />
          <span className="text-violet-400">Agent</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-gray-400 sm:text-xl">
          Find the best candidates using AI-powered semantic matching
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/recruit">
            <Button size="lg" className="w-full bg-violet-600 hover:bg-violet-500 sm:w-auto">
              Start Recruiting
              <ArrowRight className="ml-2 size-5" />
            </Button>
          </Link>
          <Link href="/recruit?demo=1">
            <Button
              size="lg"
              variant="outline"
              className="w-full border-gray-700 hover:bg-gray-900 sm:w-auto"
            >
              <Play className="mr-2 size-5" />
              View Demo
            </Button>
          </Link>
        </div>

        <div className="mt-20 grid max-w-2xl gap-6 text-left sm:grid-cols-3">
          {[
            { title: "Semantic Match", desc: "AI scores resumes against your job description" },
            { title: "Smart Pitches", desc: "Personalized \"Why this person?\" for each candidate" },
            { title: "Outreach Ready", desc: "Draft LinkedIn messages in one click" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-4"
            >
              <h3 className="font-semibold text-violet-300">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-800 py-8 text-center">
        <span className="inline-flex items-center rounded-full border border-gray-800 bg-gray-900 px-4 py-1.5 text-sm text-gray-500">
          Powered by Chutes.AI
        </span>
      </footer>
    </div>
  );
}
