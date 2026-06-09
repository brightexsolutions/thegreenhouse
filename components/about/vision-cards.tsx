import { FadeInStagger, StaggerChild } from "@/components/motion/fade-in";

const pillars = [
  {
    icon: "🌿",
    title: "Low Pressure",
    description: "No performance. No gatekeeping. Come as you are — whether you're full of faith or full of questions.",
  },
  {
    icon: "🔁",
    title: "Rotating Venues",
    description: "We move between churches and spaces across Nairobi so no single community owns the gathering.",
  },
  {
    icon: "✝️",
    title: "Cross-Church",
    description: "Built for the whole body. People from different denominations and backgrounds, one table.",
  },
  {
    icon: "⏱",
    title: "~60 Minutes",
    description: "Intentionally short. We respect your time. One tight, meaningful hour — then you're free.",
  },
];

export function VisionCards() {
  return (
    <section
      className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #f7f2e8 0%, #ede8d8 50%, #f7f2e8 100%)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-xl mb-14">
          <span className="label-caps text-gold">Our Heart</span>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest mt-2 leading-tight">
            What makes this different
          </h2>
        </div>

        <FadeInStagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          staggerDelay={0.1}
        >
          {pillars.map((p) => (
            <StaggerChild key={p.title}>
              <div className="rounded-3xl bg-off-white border border-mist p-7 h-full flex flex-col gap-4 hover:-translate-y-1 transition-all duration-300 shadow-card hover:shadow-card-hover">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-forest">{p.title}</h3>
                  <p className="text-sm text-charcoal/60 mt-2 leading-relaxed">{p.description}</p>
                </div>
              </div>
            </StaggerChild>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
