export function MarqueeStrip() {
  const items = [
    "Pause",
    "Breathe",
    "Reconnect",
    "Worship",
    "Gather",
    "Reflect",
    "Be Still",
    "Find Rest",
  ];

  const repeated = [...items, ...items]; // duplicate for seamless loop

  return (
    <div className="overflow-hidden bg-forest py-3.5 select-none" aria-hidden>
      <div className="flex animate-marquee whitespace-nowrap w-max">
        {repeated.map((item, i) => (
          <span key={i} className="flex items-center gap-4 px-4">
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-cream/70">
              {item}
            </span>
            <span className="w-1 h-1 rounded-full bg-gold/60 shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
}
