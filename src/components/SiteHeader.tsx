import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Props = {
  showLogin?: boolean;
  rightSlot?: React.ReactNode;
};

export function SiteHeader({ showLogin = true, rightSlot }: Props) {
  return (
    <header className="grid grid-cols-1 border-b border-black sm:grid-cols-[1fr_auto_auto]">
      <div className="flex items-center border-b border-black px-6 py-5 sm:border-b-0 sm:border-r">
        <Link href="/" className="text-lg font-bold tracking-tight text-black">
          // RecruitAI
        </Link>
      </div>

      <nav className="flex items-center justify-center gap-8 border-b border-black px-6 py-5 text-xs font-medium tracking-[0.2em] text-black sm:border-b-0 sm:border-r">
        <Link href="/recruit" className="hover:underline">
          RECRUIT
        </Link>
        <Link href="/recruit?demo=1" className="hover:underline">
          DEMO
        </Link>
        <Link href="/#features" className="hover:underline">
          ABOUT
        </Link>
      </nav>

      <div className="flex items-center justify-end gap-3 px-6 py-4">
        {rightSlot}
        {showLogin && (
          <Link
            href="/recruit"
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-medium tracking-wide text-white transition-opacity hover:opacity-90"
          >
            LOG IN
            <ArrowUpRight className="size-3.5" />
          </Link>
        )}
      </div>
    </header>
  );
}
