import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function PillButton({
  href,
  onClick,
  children,
  variant = "primary",
  className,
  type = "button",
  disabled,
}: Props) {
  const styles = cn(
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-xs font-semibold tracking-[0.15em] transition-opacity",
    variant === "primary" && "bg-black text-white hover:opacity-90",
    variant === "outline" && "border border-black bg-white text-black hover:bg-black/5",
    disabled && "pointer-events-none opacity-50",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={styles}>
      {children}
    </button>
  );
}
