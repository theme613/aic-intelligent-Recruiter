type StatItem = {
  content: React.ReactNode;
  label?: string;
};

type Props = {
  items: StatItem[];
};

export function StatsBar({ items }: Props) {
  return (
    <section className="grid grid-cols-1 border-t border-black sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex min-h-[100px] flex-col justify-center border-b border-black px-6 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
        >
          {item.content}
          {item.label && (
            <p className="mt-2 text-sm text-black/70">{item.label}</p>
          )}
        </div>
      ))}
    </section>
  );
}
