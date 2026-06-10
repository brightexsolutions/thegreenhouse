"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// Unsplash photos chosen for warmth, community, and green/natural tones
const PHOTOS = {
  worship: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=700&q=80",
  connect: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=80",
  reflect: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=700&q=80",
};

export function HeroCollage() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  };

  const item = (delay = 0) => ({
    hidden: { opacity: 0, y: reduce ? 0 : 32 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE, delay } },
  });

  return (
    <section className="relative min-h-[100svh] bg-forest-dark flex items-center overflow-hidden pt-20">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_60%_40%,rgba(201,162,74,0.10),transparent)]" />

      {/* Decorative rings */}
      <div className="absolute top-12 right-[38%] w-48 h-48 rounded-full border border-cream/5 hidden lg:block" />
      <div className="absolute bottom-16 left-8 w-32 h-32 rounded-full border border-gold/10 hidden lg:block" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Left — copy */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6"
          >
            <motion.div variants={item(0)} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-dot" />
              <span className="label-caps text-gold/80 tracking-widest">Nairobi · Quarterly</span>
            </motion.div>

            <motion.h1
              variants={item(0.05)}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-cream leading-[0.95] tracking-tight"
            >
              A place to{" "}
              <em className="not-italic text-gold">breathe</em>
              {" "}and{" "}
              <em className="not-italic text-gold">connect</em>
            </motion.h1>

            <motion.p
              variants={item(0.1)}
              className="text-cream/70 text-base sm:text-lg max-w-sm leading-relaxed"
            >
              Cross-church. Low pressure.
              A quarterly evening of worship, prayer, and real conversation.
            </motion.p>

            <motion.div variants={item(0.15)} className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-forest font-semibold text-sm hover:bg-gold-light transition-all duration-200 hover:-translate-y-0.5"
              >
                Reserve a spot
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-cream/20 text-cream/80 font-medium text-sm hover:border-cream/40 hover:text-cream transition-all duration-200"
              >
                Learn more
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — photo collage */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative h-[420px] sm:h-[500px] lg:h-[580px] hidden sm:block"
          >
            {/* Card 1 — large pill, left, Worship */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: -6 }}
              animate={{ opacity: 1, y: 0, rotate: -6 }}
              transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
              className="absolute left-0 top-8 w-[48%] h-[72%] rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <Image
                src={PHOTOS.worship}
                alt="Worship"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 40vw, 22vw"
                priority
              />
              {/* Strong scrim for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="label-caps text-cream text-xs font-semibold tracking-widest">Worship</span>
              </div>
            </motion.div>

            {/* Card 2 — medium, top right, Connect */}
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: 4 }}
              animate={{ opacity: 1, y: 0, rotate: 4 }}
              transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
              className="absolute right-0 top-0 w-[44%] h-[46%] rounded-[2rem] overflow-hidden shadow-xl"
            >
              <Image
                src={PHOTOS.connect}
                alt="Connect"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 36vw, 20vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="label-caps text-cream text-xs font-semibold tracking-widest">Connect</span>
              </div>
            </motion.div>

            {/* Card 3 — arch, bottom right, Reflect */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: 2 }}
              animate={{ opacity: 1, y: 0, rotate: 2 }}
              transition={{ duration: 0.8, delay: 0.68, ease: EASE }}
              className="absolute right-4 bottom-4 w-[40%] h-[46%] overflow-hidden shadow-xl"
              style={{ borderRadius: "50% 50% 2rem 2rem / 50% 50% 2rem 2rem" }}
            >
              <Image
                src={PHOTOS.reflect}
                alt="Reflect"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 32vw, 18vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="label-caps text-cream text-xs font-semibold tracking-widest">Reflect</span>
              </div>
            </motion.div>

            {/* Gold decorative circle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute right-[36%] bottom-[28%] w-12 h-12 rounded-full border-2 border-gold/50"
            />

            {/* Session count badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="absolute left-[42%] top-[42%] bg-forest/80 backdrop-blur-sm border border-gold/30 rounded-2xl px-4 py-3 shadow-lg"
            >
              <span className="font-display text-2xl font-semibold text-cream">02</span>
              <p className="text-xs text-cream/70 mt-0.5 uppercase tracking-wider">Session</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="label-caps text-cream/60 text-xs">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-cream/60 to-transparent" />
      </div>
    </section>
  );
}
