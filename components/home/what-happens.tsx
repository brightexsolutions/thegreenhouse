import { FadeIn } from "@/components/motion/fade-in";
import { BookOpen, MessageCircle, Music, Wind } from "lucide-react";
import { Photo } from "@/components/ui/photo";

const MOMENTS = [
  { icon: Wind, label: "Pause",   body: "The room stops. You exhale. There's nowhere you need to be right now." },
  { icon: Music, label: "Worship", body: "Live music from rotating teams. Different churches, one sound." },
  { icon: BookOpen, label: "Reflect", body: "Space to sit with what God is saying, without rushing past it." },
  { icon: MessageCircle, label: "Connect", body: "Genuine conversation with people you wouldn't normally meet." },
];

export function WhatHappens({ photos = [] }: { photos?: Array<string | null> }) {
  const [main, inset] = [0, 1].map(i => photos[i] ?? null);

  return (
    <section className="py-20 md:py-32 bg-cream overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — photo stack */}
          <FadeIn direction="left">
            <div className="relative h-[480px] sm:h-[560px]">
              {/* Main large photo */}
              <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <Photo
                  src={main}
                  alt="An evening at The Green House"
                  width={1200}
                  sizes="(max-width: 1024px) 90vw, 44vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/60 via-transparent to-transparent" />
              </div>

              {/* Smaller overlay photo — bottom right */}
              <div className="absolute -bottom-6 -right-4 sm:-right-8 w-[46%] h-[42%] rounded-[1.5rem] overflow-hidden shadow-xl border-4 border-cream bg-forest-dark">
                <Photo
                  src={inset}
                  alt="Community connection"
                  width={600}
                  sizes="(max-width: 1024px) 42vw, 22vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* Gold ring decoration */}

              {/* Session count chip */}
              <div className="absolute top-6 left-6 bg-forest/80 backdrop-blur-sm border border-gold/30 rounded-2xl px-4 py-3 shadow-lg">
                <p className="text-xs text-cream/60 uppercase tracking-wider mb-0.5">Est.</p>
                <p className="font-display text-xl font-semibold text-cream">2026</p>
              </div>
            </div>
          </FadeIn>

          {/* Right — copy */}
          <FadeIn delay={0.15}>
            <span className="label-caps text-gold">What to expect</span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest mt-2 mb-5 leading-tight">
              An evening that<br />
              <em className="not-italic text-gold">stays with you</em>
            </h2>
            <p className="text-charcoal/65 text-base leading-relaxed mb-10">
              Not a concert. Not a conference. A space built for tired souls, people from
              different churches across Nairobi who need somewhere to slow down, exhale, and
              find God and each other without the noise.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOMENTS.map((m) => (
                <div key={m.label} className="flex items-start gap-3.5 p-4 rounded-2xl bg-off-white border border-mist">
                  <m.icon className="w-6 h-6 mt-1 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                  <div>
                    <p className="font-semibold text-forest text-sm">{m.label}</p>
                    <p className="text-charcoal/70 text-sm leading-relaxed mt-0.5">{m.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 pt-6 border-t border-mist text-sm text-charcoal/70 leading-snug">
              People from <span className="font-semibold text-forest">different churches</span> across Nairobi
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
