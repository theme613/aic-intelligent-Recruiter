import { cn } from "@/lib/utils";

type Props = {
  label: string;
  score: number;
  className?: string;
};

export function DimensionBar({ label, score, className }: Props) {
  const clamped = Math.min(100, Math.max(0, score));
  const filled = Math.round(clamped / 10);
  const empty = 10 - filled;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-black/60">{label}</span>
        <span className="font-semibold">{clamped}%</span>
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] leading-none sm:text-xs">
        <span className="text-black">{"█".repeat(filled)}</span>
        <span className="text-black/20">{"░".repeat(empty)}</span>
      </div>
    </div>
  );
}
