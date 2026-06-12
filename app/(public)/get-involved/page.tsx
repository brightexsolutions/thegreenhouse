import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FadeIn, FadeInStagger, StaggerChild } from "@/components/motion/fade-in";
import { InvolvementForm } from "@/components/get-involved/involvement-form";

export const metadata: Metadata = {
  title: "Get Involved",
  description: "Serve at The Green House — lead worship, host a venue, or join our volunteer team. Every role matters.",
  alternates: { canonical: "/get-involved" },
};

const ROLES = [
  {
    image:   "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=75",
    title:   "Worship Team",
    tagline: "Lead the room",
    body:    "Are you a vocalist or instrumentalist? We rotate worship teams each session. Your church background doesn't matter — your heart does.",
  },
  {
    image:   "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&q=75",
    title:   "Host a Venue",
    tagline: "Open your doors",
    body:    "We intentionally rotate between spaces. If your church or space can seat 80–200 people and you'd like to host, we'd love to talk.",
  },
  {
    image:   "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=75",
    title:   "Vision Carrier",
    tagline: "Shape what it becomes",
    body:    "A small group of people who believe in what The Green House is doing and want to help it grow — through prayer, ideas, and showing up.",
  },
  {
    image:   "https://images.unsplash.com/photo-1452802447250-470a88ac82bc?auto=format&fit=crop&w=800&q=75",
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

export default async function GetInvolvedPage({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string }>;
}) {
  const { interest } = await searchParams;
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
            unoptimized
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

      {/* Two-path entry — draws attention to both volunteer and financial support */}
      <section className="bg-cream py-10 border-b border-mist">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="#roles"
              className="group flex items-center gap-5 p-5 rounded-2xl border border-mist bg-white hover:border-forest/30 hover:shadow-card transition-all duration-200"
            >
              <span className="w-11 h-11 rounded-full bg-forest/10 flex items-center justify-center text-xl shrink-0 group-hover:bg-forest/20 transition-colors">🌿</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-forest text-sm">Volunteer your gift</p>
                <p className="text-charcoal/50 text-xs mt-0.5">Worship, hosting, creative, vision</p>
              </div>
              <span className="text-forest/30 group-hover:text-forest transition-colors text-sm">↓</span>
            </a>
            <a
              href="?interest=give#contact"
              className="group flex items-center gap-5 p-5 rounded-2xl border border-gold/30 bg-gold-pale hover:border-gold/60 hover:shadow-card transition-all duration-200"
            >
              <span className="w-11 h-11 rounded-full bg-gold/15 flex items-center justify-center text-xl shrink-0 group-hover:bg-gold/25 transition-colors">🤝</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-forest text-sm">Support financially</p>
                <p className="text-charcoal/50 text-xs mt-0.5">Partner with us to fund the mission</p>
              </div>
              <span className="text-gold/50 group-hover:text-gold transition-colors text-sm">↓</span>
            </a>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 md:py-28 bg-cream">
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
                <div className="group relative rounded-3xl overflow-hidden h-[280px] flex flex-col justify-end hover:-translate-y-1 transition-all duration-300 shadow-card hover:shadow-card-hover">
                  <Image
                    src={role.image}
                    alt=""
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width:640px) 90vw, (max-width:1024px) 45vw, 44vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/65 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-forest/20" />
                  <div className="relative p-7">
                    <span className="label-caps text-gold/90 text-xs">{role.tagline}</span>
                    <h3 className="font-display text-2xl font-semibold text-cream mt-1 mb-2">{role.title}</h3>
                    <p className="text-cream/70 text-sm leading-relaxed">{role.body}</p>
                  </div>
                </div>
              </StaggerChild>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Cinematic quote strip */}
      <section className="relative h-[42vh] min-h-[280px] overflow-hidden flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=70"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          aria-hidden
          unoptimized
        />
        <div className="absolute inset-0 bg-forest/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(201,162,74,0.08),transparent)]" />
        <FadeIn>
          <div className="relative text-center px-6 max-w-2xl mx-auto">
            <p className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-cream leading-tight">
              &ldquo;Every role is given freely.<br />
              <em className="not-italic text-gold">None is given lightly.</em>&rdquo;
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Financial Support */}
      <section id="support" className="py-20 md:py-28 bg-cream overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <span className="label-caps text-gold">Partner With Us</span>
              <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest mt-2 mb-5 leading-tight">
                Why your generosity<br />matters
              </h2>
              <p className="text-charcoal/60 text-base leading-relaxed mb-4">
                Every session has real costs — a warm venue, quality sound, invited guests, and the
                small touches that make the room feel like a haven, not just a hall.
              </p>
              <p className="text-charcoal/60 text-base leading-relaxed">
                By giving, you&apos;re not just covering expenses. You&apos;re directly investing in a space
                where many people come tired and leave restored — and in the larger vision of community
                outreach, mental health support, and discipleship that lies ahead.
              </p>
              <Link
                href="?interest=give#contact"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3.5 rounded-full bg-forest text-cream font-semibold text-sm hover:bg-moss transition-all duration-200"
              >
                Reach out to give →
              </Link>
            </FadeIn>

            {/* Right — photo with overlaid list */}
            <FadeIn delay={0.1}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <div className="relative h-[420px]">
                  <Image
                    src="https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?auto=format&fit=crop&w=900&q=80"
                    alt="African community gathering"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width:1024px) 90vw, 44vw"
                    unoptimized
                  />
                  {/* Strong gradient so text is always legible */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d2218] via-[#0d2218]/85 to-[#0d2218]/25" />
                  <div className="absolute inset-x-0 bottom-0 p-7 space-y-3.5">
                    {[
                      { icon: "🏛", label: "Venue & Space",     body: "A warm, comfortable physical setting — the foundation of everything." },
                      { icon: "🎵", label: "Sound & Equipment", body: "Quality acoustics so worship doesn't feel like an afterthought." },
                      { icon: "👤", label: "Invited Guests",    body: "Voices and gifts that enrich every session for everyone in the room." },
                      { icon: "☕", label: "Hospitality",       body: "The small touches that turn a gathering into a community." },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <span className="text-base mt-0.5 shrink-0">{item.icon}</span>
                        <div>
                          <p className="font-semibold text-white text-sm leading-snug">{item.label}</p>
                          <p className="text-white/70 text-xs leading-relaxed mt-0.5">{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
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
      <section id="contact" className="py-20 md:py-28 bg-cream">
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
                <InvolvementForm defaultInterest={interest} />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
