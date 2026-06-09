import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn, FadeInStagger, StaggerChild } from "@/components/motion/fade-in";
import { whatsappUrl } from "@/lib/constants";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Get Involved",
  description: "Serve at The Green House — lead worship, host a venue, or join our volunteer team. Every role matters.",
  alternates: { canonical: "/get-involved" },
};

const ROLES = [
  {
    emoji:   "🎵",
    title:   "Worship Team",
    tagline: "Lead the room",
    body:    "Are you a vocalist or instrumentalist? We rotate worship teams each session. Your church background doesn't matter — your heart does.",
    cta:     "Join the worship rotation",
    wa:      "I'd love to be part of the worship team at The Green House. My name is…",
  },
  {
    emoji:   "🏛",
    title:   "Host a Venue",
    tagline: "Open your doors",
    body:    "We intentionally rotate between spaces. If your church or space can seat 80–200 people and you'd like to host, we'd love to talk.",
    cta:     "Offer your venue",
    wa:      "I'd like to offer a venue for The Green House. Our space is…",
  },
  {
    emoji:   "🌿",
    title:   "Vision Carrier",
    tagline: "Shape what it becomes",
    body:    "A small group of people who believe in what The Green House is doing and want to help it grow — through prayer, ideas, and showing up.",
    cta:     "Become a vision carrier",
    wa:      "I want to be a Vision Carrier at The Green House. I'm interested in…",
  },
  {
    emoji:   "📸",
    title:   "Creative Team",
    tagline: "Capture and create",
    body:    "Photography, video, design, or social — if you have a creative skill and want to use it for something meaningful, this is for you.",
    cta:     "Join the creative team",
    wa:      "I'd like to join the creative team at The Green House. My skills include…",
  },
];

const VALUES = [
  { label: "No ego",         body: "You come to serve, not to be seen." },
  { label: "Rotate freely",  body: "No one owns a role. Everyone passes it on." },
  { label: "Show up whole",  body: "Don't perform. Just be genuinely present." },
  { label: "Stay connected", body: "Keep in touch between sessions, not just on the day." },
];

export default function GetInvolvedPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-forest pt-32 pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_70%_30%,rgba(201,162,74,0.08),transparent)]" />
        <div className="absolute top-24 left-16 w-36 h-36 rounded-full border border-cream/5 hidden lg:block" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-end">
            <FadeIn>
              <span className="label-caps text-gold/80">Get Involved</span>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-cream mt-2 leading-[0.95]">
                Help build
                <br />
                <em className="not-italic text-gold">something real.</em>
              </h1>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="text-cream/50 text-base sm:text-lg max-w-md leading-relaxed">
                The Green House runs because people choose to show up — before, during, and after sessions. Every role is voluntary. Every contribution matters.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="max-w-lg mb-14">
              <span className="label-caps text-gold">Ways to serve</span>
              <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest mt-2 leading-tight">
                Find your place
              </h2>
            </div>
          </FadeIn>

          <FadeInStagger className="grid sm:grid-cols-2 gap-5" staggerDelay={0.08}>
            {ROLES.map((role) => (
              <StaggerChild key={role.title}>
                <div className="group relative bg-white border border-mist rounded-3xl p-7 h-full flex flex-col hover:-translate-y-1 transition-all duration-300 shadow-card hover:shadow-card-hover overflow-hidden">
                  {/* Hover gold line */}
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gold group-hover:w-full transition-all duration-500" />

                  <span className="text-4xl mb-5">{role.emoji}</span>
                  <div className="flex-1">
                    <span className="label-caps text-gold text-[9px]">{role.tagline}</span>
                    <h3 className="font-display text-2xl font-semibold text-forest mt-1 mb-3">{role.title}</h3>
                    <p className="text-sm text-charcoal/60 leading-relaxed">{role.body}</p>
                  </div>
                  <Link
                    href={whatsappUrl(role.wa)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-gold transition-colors"
                  >
                    {role.cta} →
                  </Link>
                </div>
              </StaggerChild>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Values */}
      <section
        className="py-20 md:py-28 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1b3a2a 0%, #2d5240 50%, #1b3a2a 100%)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(201,162,74,0.06),transparent)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="label-caps text-gold/70">How we serve</span>
              <h2 className="font-display text-4xl md:text-5xl font-semibold text-cream mt-2">
                The posture we carry
              </h2>
            </div>
          </FadeIn>

          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" staggerDelay={0.08}>
            {VALUES.map((v, i) => (
              <StaggerChild key={v.label}>
                <div className="text-center px-4">
                  <p className="font-display text-5xl font-semibold text-gold/20 mb-4">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="font-display text-xl font-semibold text-cream mb-2">{v.label}</h3>
                  <p className="text-cream/50 text-sm leading-relaxed">{v.body}</p>
                </div>
              </StaggerChild>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-cream text-center">
        <div className="max-w-lg mx-auto px-4">
          <FadeIn>
            <p className="text-2xl mb-4">🌱</p>
            <h2 className="font-display text-4xl font-semibold text-forest mb-3">
              Not sure where to start?
            </h2>
            <p className="text-charcoal/50 text-sm mb-8 leading-relaxed">
              Just attend a session first. Let the room show you where you belong.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/events"
                className="px-7 py-3.5 rounded-full bg-forest text-cream font-semibold text-sm hover:bg-moss transition-all"
              >
                See upcoming sessions
              </Link>
              <Link
                href={whatsappUrl("Hi, I'd like to know more about The Green House and how to get involved.")}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-full border border-mist text-charcoal/60 font-semibold text-sm hover:border-forest/30 hover:text-forest transition-all"
              >
                Ask on WhatsApp
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
