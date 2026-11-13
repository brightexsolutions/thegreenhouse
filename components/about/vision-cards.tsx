import { Brain, Church, Hourglass, Leaf } from "lucide-react";
import { FadeInStagger, StaggerChild } from "@/components/motion/fade-in";

const pillars = [
  {
    icon: Leaf,
    title: "A Safe Space",
    description: "No performance. No gatekeeping. A genuinely low-pressure room where you can exhale, be honest, and encounter God without putting on a show.",
  },
  {
    icon: Church,
    title: "Cross-Church",
    description: "Run by gifted people from active ministries across Nairobi: meeting as the wider body, not as competing congregations.",
  },
  {
    icon: Brain,
    title: "Whole-Person Focus",
    description: "We take seriously the mental and emotional weight many Christians quietly carry: this space is built for real renewal, not just religious attendance.",
  },
  {
    icon: Hourglass,
    title: "Unhurried",
    description: "2–3 hours of worship, hymns, sharing, and genuine connection. Long enough to actually decompress. Rare enough that each session counts.",
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
                <p.icon className="w-7 h-7 text-gold" strokeWidth={1.5} aria-hidden />
                <div>
                  <h3 className="font-display text-xl font-semibold text-forest">{p.title}</h3>
                  <p className="text-sm text-charcoal/65 mt-2 leading-relaxed">{p.description}</p>
                </div>
              </div>
            </StaggerChild>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
