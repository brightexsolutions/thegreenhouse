import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FadeIn, FadeInStagger, StaggerChild } from "@/components/motion/fade-in";
import { InvolvementForm } from "@/components/get-involved/involvement-form";

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
  },
  {
    emoji:   "🏛",
    title:   "Host a Venue",
    tagline: "Open your doors",
    body:    "We intentionally rotate between spaces. If your church or space can seat 80–200 people and you'd like to host, we'd love to talk.",
  },
  {
    emoji:   "🌿",
    title:   "Vision Carrier",
    tagline: "Shape what it becomes",
    body:    "A small group of people who believe in what The Green House is doing and want to help it grow — through prayer, ideas, and showing up.",
  },
  {
    emoji:   "📸",
    title:   "Creative Team",
    tagline: "Capture and create",
    body:    "Photography, video, design, or social — if you have a creative skill and want to use it for something meaningful, this is for you.",
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
      {/* Hero — photo background */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden pt-20">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=75"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/88 to-forest/55" />
        </div>
        <div className="absolute top-24 left-16 w-36 h-36 rounded-full border border-cream/5 hidden lg:block" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
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
              <p className="text-cream/70 text-base sm:text-lg max-w-md leading-relaxed">
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
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gold group-hover:w-full transition-all duration-500" />
                  <span className="text-4xl mb-5">{role.emoji}</span>
                  <div className="flex-1">
                    <span className="label-caps text-gold text-xs">{role.tagline}</span>
                    <h3 className="font-display text-2xl font-semibold text-forest mt-1 mb-3">{role.title}</h3>
                    <p className="text-sm text-charcoal/70 leading-relaxed">{role.body}</p>
                  </div>
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
              <span className="label-caps text-gold/80">How we serve</span>
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
                  <p className="text-cream/70 text-sm leading-relaxed">{v.body}</p>
                </div>
              </StaggerChild>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Contact form */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left — copy */}
            <FadeIn>
              <span className="label-caps text-gold">Get in touch</span>
              <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest mt-2 mb-5 leading-tight">
                Tell us a little<br />about yourself
              </h2>
              <p className="text-charcoal/60 text-base leading-relaxed mb-8">
                Fill in the form and someone from the team will reach out.
                No pressure, no commitment — just a conversation.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm">🌱</span>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-forest">Not sure where to start?</p>
                    <p className="text-sm text-charcoal/60 mt-0.5">Just attend a session first. Let the room show you where you belong.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm">📅</span>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-forest">Sessions are quarterly</p>
                    <p className="text-sm text-charcoal/60 mt-0.5">We gather four times a year in different venues across Nairobi.</p>
                  </div>
                </div>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-forest text-cream font-semibold text-sm hover:bg-moss transition-all"
              >
                See upcoming sessions →
              </Link>
            </FadeIn>

            {/* Right — form */}
            <FadeIn delay={0.1}>
              <div className="bg-white border border-mist rounded-3xl p-8 shadow-card">
                <InvolvementForm />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
