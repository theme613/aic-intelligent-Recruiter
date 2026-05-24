export function HeroIllustration() {
  return (
    <div className="relative flex h-full min-h-[320px] w-full items-center justify-center overflow-hidden bg-[#f4f4f4] p-8 sm:min-h-[480px]">
      {/* Grid lines */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-0 h-full w-px bg-black" />
        <div className="absolute left-2/4 top-0 h-full w-px bg-black" />
        <div className="absolute left-3/4 top-0 h-full w-px bg-black" />
        <div className="absolute left-0 top-1/3 h-px w-full bg-black" />
        <div className="absolute left-0 top-2/3 h-px w-full bg-black" />
      </div>

      {/* Black squares + connector */}
      <div className="absolute left-[12%] top-[18%] flex items-center gap-3">
        <div className="size-10 border border-black bg-black sm:size-14" />
        <div className="h-px w-16 bg-black sm:w-24" />
        <div className="size-8 border border-black bg-black sm:size-10" />
      </div>

      {/* Red triangle */}
      <div
        className="absolute right-[28%] top-[22%] size-0 border-b-[72px] border-l-[42px] border-r-[42px] border-b-[#E63946] border-l-transparent border-r-transparent sm:border-b-[100px] sm:border-l-[58px] sm:border-r-[58px]"
        style={{ filter: "url(#grain)" }}
      />

      {/* Blue cylinder */}
      <div className="absolute bottom-[28%] left-[22%] flex h-28 w-16 flex-col overflow-hidden rounded-full border border-black sm:h-36 sm:w-20">
        <div className="h-1/2 bg-[#4A6FA5]" />
        <div className="h-1/2 bg-[#3d5d8a]" />
      </div>

      {/* Up arrow */}
      <div className="absolute bottom-[32%] right-[32%]">
        <div className="size-0 border-b-[48px] border-l-[24px] border-r-[24px] border-b-black border-l-transparent border-r-transparent sm:border-b-[64px] sm:border-l-[32px] sm:border-r-[32px]" />
      </div>

      {/* Gear flowers */}
      <div className="absolute bottom-[12%] right-[10%] flex gap-2 text-[#7eb8da]">
        <span className="text-3xl sm:text-4xl">✿</span>
        <span className="text-2xl sm:text-3xl">✿</span>
        <span className="text-xl sm:text-2xl">✿</span>
      </div>

      {/* Resume doc icon */}
      <div className="absolute right-[8%] top-[12%] rounded border-2 border-black bg-white px-3 py-2 text-[10px] font-bold tracking-widest sm:text-xs">
        AI
      </div>

      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
    </div>
  );
}
