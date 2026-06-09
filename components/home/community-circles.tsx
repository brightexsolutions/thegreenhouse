import { FadeIn, FadeInStagger, StaggerChild } from "@/components/motion/fade-in";

const circles = [
  {
    name: "Inner Circle",
    tag: "Core Team",
    description: "Vocalists, instrumentalists, and vision-carriers who build each session.",
    color: "bg-forest text-cream",
    border: "border-forest",
  },
  {
    name: "Collaborators",
    tag: "Invited",
    description: "Gifted musicians and worshippers invited to contribute to specific sessions.",
    color: "bg-gold-pale text-forest",
    border: "border-gold",
  },
  {
    name: "Community",
    tag: "Everyone",
    description: "Guests, attendees, and anyone who comes to encounter God and find connection.",
    color: "bg-mist text-charcoal",
    border: "border-mist",
  },
];

export function CommunityCircles() {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="label-caps text-gold">Who We Are</span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest mt-2">
              Three circles,<br />one community
            </h2>
          </div>
        </FadeIn>

        <FadeInStagger className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6" staggerDelay={0.12}>
          {circles.map((c, i) => (
            <StaggerChild key={c.name}>
              <div
                className={`relative rounded-3xl border-2 ${c.border} p-7 lg:p-8 h-full flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Number */}
                <span className="font-display text-6xl font-semibold opacity-10 absolute top-5 right-6 select-none">
                  {i + 1}
                </span>

                <div className={`w-10 h-10 rounded-full ${c.color} flex items-center justify-center text-xs font-semibold`}>
                  {c.name.charAt(0)}
                </div>

                <div>
                  <span className="label-caps text-gold">{c.tag}</span>
                  <h3 className="font-display text-2xl font-semibold text-forest mt-1">{c.name}</h3>
                </div>

                <p className="text-sm text-charcoal/60 leading-relaxed">{c.description}</p>
              </div>
            </StaggerChild>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
