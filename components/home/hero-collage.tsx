"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const PHOTOS = {
  pause:   "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80",
  worship: "https://res.cloudinary.com/dpjget2he/image/upload/v1781375011/IMG_4476_mkgrmd.jpg",
  connect: "https://res.cloudinary.com/dpjget2he/image/upload/v1781373355/IMG_4402_gwdrn1.jpg",
  reflect: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=700&q=80",
};

const PARTICLES = [
  { left: "12%",  top: "22%", size: 4,   dur: 7,   delay: 0,   color: "rgba(201,162,74,0.80)" },
  { left: "88%",  top: "36%", size: 3,   dur: 9,   delay: 2,   color: "rgba(201,162,74,0.70)" },
  { left: "65%",  top: "14%", size: 3,   dur: 6,   delay: 4,   color: "rgba(247,242,232,0.65)" },
  { left: "22%",  top: "62%", size: 4,   dur: 8,   delay: 1,   color: "rgba(201,162,74,0.75)" },
  { left: "78%",  top: "72%", size: 3,   dur: 10,  delay: 3,   color: "rgba(247,242,232,0.60)" },
  { left: "42%",  top: "80%", size: 3,   dur: 7.5, delay: 5,   color: "rgba(201,162,74,0.70)" },
  { left: "18%",  top: "46%", size: 3,   dur: 11,  delay: 2.5, color: "rgba(247,242,232,0.55)" },
  { left: "56%",  top: "56%", size: 3,   dur: 8.5, delay: 6,   color: "rgba(201,162,74,0.72)" },
];

function AnimatedBackground() {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Rich dark multi-stop gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(150deg, #050d07 0%, #0c1c11 35%, #162c1e 65%, #090f0b 100%)",
        }}
      />

      {/* Layered depth radials — gold bloom top-right, moss bloom bottom-left, cream shimmer top-center */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 75% 55% at 72% 22%, rgba(201,162,74,0.11) 0%, transparent 65%)",
            "radial-gradient(ellipse 60% 75% at 8% 90%, rgba(45,82,64,0.30) 0%, transparent 55%)",
            "radial-gradient(ellipse 50% 42% at 50% -5%, rgba(247,242,232,0.05) 0%, transparent 58%)",
          ].join(", "),
        }}
      />

      {/* Animated glowing orbs */}
      {!reduce && (
        <>
          {/* Gold orb — drifts top-right */}
          <motion.div
            animate={{ x: [0, 28, -14, 8, 0], y: [0, -22, 16, -8, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-12%] right-[8%] w-[60%] h-[65%]"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(201,162,74,0.20) 0%, transparent 65%)",
              filter: "blur(72px)",
            }}
          />

          {/* Moss orb — bottom-left */}
          <motion.div
            animate={{ x: [0, -20, 12, 0], y: [0, 22, -14, 0] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 5 }}
            className="absolute bottom-[-8%] left-[-8%] w-[55%] h-[65%]"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(45,82,64,0.55) 0%, transparent 65%)",
              filter: "blur(80px)",
            }}
          />

          {/* Cream pulse — center-top, breathes */}
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.05, 0.10, 0.05] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-0 left-[35%] w-[50%] h-[38%]"
            style={{
              background: "radial-gradient(circle at 50% 20%, rgba(247,242,232,1) 0%, transparent 65%)",
              filter: "blur(90px)",
            }}
          />
        </>
      )}

      {/* Static decorative rings */}
      <div className="absolute top-12 right-[38%] w-48 h-48 rounded-full border border-cream/[0.05] hidden lg:block" />
      <div className="absolute bottom-16 left-8 w-32 h-32 rounded-full border border-gold/[0.10] hidden lg:block" />
      <div className="absolute top-[32%] left-[18%] w-72 h-72 rounded-full border border-cream/[0.03] hidden lg:block" />

      {/* Ripple ring — expands and fades on loop */}
      {!reduce && (
        <motion.div
          animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
          className="absolute top-[22%] right-[40%] w-24 h-24 rounded-full border-2 border-gold/70 hidden lg:block"
        />
      )}

      {/* Floating particles */}
      {!reduce && PARTICLES.map(({ left, top, size, dur, delay, color }, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -16, 0], opacity: [0.65, 1, 0.65] }}
          transition={{ duration: dur, repeat: Infinity, ease: "easeInOut", delay }}
          className="absolute rounded-full"
          style={{ left, top, width: size, height: size, backgroundColor: color, boxShadow: `0 0 ${size * 3}px ${color}` }}
        />
      ))}
    </div>
  );
}

/**
 * Outer div: entrance slide-up. Inner div: infinite float.
 * Separating them prevents the float loop from resetting the entrance.
 */
function FloatCard({
  entranceDelay,
  rotate,
  floatDuration,
  floatDelay,
  floatAmount = 10,
  className,
  style,
  children,
}: {
  entranceDelay: number;
  rotate: number;
  floatDuration: number;
  floatDelay: number;
  floatAmount?: number;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 36, rotate }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ duration: 0.8, delay: entranceDelay, ease: EASE }}
      className={className}
      style={style}
    >
      <motion.div
        animate={reduce ? {} : { y: [0, -floatAmount, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: "easeInOut", delay: floatDelay }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function CardInner({
  src, alt, label, borderRadius,
}: {
  src: string; alt: string; label: string; borderRadius?: string;
}) {
  return (
    <div className="relative w-full h-full overflow-hidden shadow-2xl" style={{ borderRadius: borderRadius ?? "2rem" }}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width:1024px) 40vw, 22vw" priority={alt === "Worship" || alt === "Pause"} unoptimized />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <span className="label-caps text-cream text-xs font-bold tracking-widest">{label}</span>
      </div>
    </div>
  );
}

export function HeroCollage() {
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  };
  const item = (delay = 0) => ({
    hidden: { opacity: 0, y: 32 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE, delay } },
  });

  return (
    <section className="relative min-h-[100svh] bg-forest-dark flex items-center overflow-hidden pt-20">
      <AnimatedBackground />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Mobile image strip — visible only below sm, sits above the copy */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="block sm:hidden relative h-52 -mx-4"
            aria-hidden
          >
            {/* Worship card — large, left-leaning */}
            <FloatCard
              entranceDelay={0.3}
              rotate={-5}
              floatDuration={4.4}
              floatDelay={0}
              floatAmount={10}
              className="absolute left-4 top-0 w-[54%] h-full"
            >
              <CardInner src={PHOTOS.worship} alt="Worship" label="Worship" borderRadius="1.75rem" />
            </FloatCard>

            {/* Connect card — smaller, right-offset, lower */}
            <FloatCard
              entranceDelay={0.44}
              rotate={4}
              floatDuration={3.8}
              floatDelay={1.4}
              floatAmount={8}
              className="absolute right-4 top-[14%] w-[46%] h-[80%]"
            >
              <CardInner src={PHOTOS.connect} alt="Connect" label="Connect" borderRadius="1.5rem" />
            </FloatCard>

            {/* Session badge chip — floats between the two cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="absolute left-[42%] top-[36%] -translate-x-1/2 bg-forest/85 backdrop-blur-sm border border-gold/35 rounded-xl px-3 py-2 shadow-lg z-10"
            >
              <span className="font-display text-lg font-semibold text-cream leading-none">02</span>
              <p className="text-[10px] text-cream/65 mt-0.5 uppercase tracking-wider">Session</p>
            </motion.div>

            {/* Gold ring accent */}
            <motion.div
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute right-[38%] bottom-4 w-7 h-7 rounded-full border-2 border-gold/50 pointer-events-none"
            />
          </motion.div>

          {/* Left — copy */}
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">
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

            <motion.p variants={item(0.1)} className="text-cream/70 text-base sm:text-lg max-w-sm leading-relaxed">
              A quarterly cross-church gathering in Nairobi — low pressure, real connection, all welcome.
            </motion.p>

            <motion.div variants={item(0.15)} className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-forest font-semibold text-sm hover:bg-gold-light transition-all duration-200 hover:-translate-y-0.5"
              >
                Reserve a spot <ArrowRight size={15} />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-cream/20 text-cream/80 font-medium text-sm hover:border-cream/40 hover:text-cream transition-all duration-200"
              >
                Learn more
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — 4-card floating collage */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative h-[480px] sm:h-[540px] lg:h-[600px] hidden sm:block"
          >
            {/* Card: PAUSE — small square, top-left */}
            <FloatCard
              entranceDelay={0.38}
              rotate={3}
              floatDuration={4.0}
              floatDelay={1.6}
              floatAmount={8}
              className="absolute left-0 top-0 w-[33%] h-[32%]"
            >
              <CardInner src={PHOTOS.pause} alt="Pause" label="Pause" borderRadius="1.75rem" />
            </FloatCard>

            {/* Card: WORSHIP — large pill, left-center */}
            <FloatCard
              entranceDelay={0.50}
              rotate={-5}
              floatDuration={4.4}
              floatDelay={0}
              floatAmount={12}
              className="absolute left-0 top-[30%] w-[47%] h-[66%]"
            >
              <CardInner src={PHOTOS.worship} alt="Worship" label="Worship" borderRadius="2.5rem" />
            </FloatCard>

            {/* Card: CONNECT — medium, top-right */}
            <FloatCard
              entranceDelay={0.62}
              rotate={4}
              floatDuration={3.6}
              floatDelay={2.0}
              floatAmount={10}
              className="absolute right-0 top-0 w-[44%] h-[46%]"
            >
              <CardInner src={PHOTOS.connect} alt="Connect" label="Connect" borderRadius="2rem" />
            </FloatCard>

            {/* Card: REFLECT — arch, bottom-right */}
            <FloatCard
              entranceDelay={0.74}
              rotate={2}
              floatDuration={4.8}
              floatDelay={0.8}
              floatAmount={9}
              className="absolute right-4 bottom-0 w-[40%] h-[46%]"
              style={{ borderRadius: "50% 50% 2rem 2rem / 50% 50% 2rem 2rem" }}
            >
              <div
                className="relative w-full h-full overflow-hidden shadow-2xl"
                style={{ borderRadius: "inherit" }}
              >
                <Image src={PHOTOS.reflect} alt="Reflect" fill className="object-cover" sizes="(max-width:1024px) 34vw, 18vw" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="label-caps text-cream text-xs font-bold tracking-widest">Reflect</span>
                </div>
              </div>
            </FloatCard>

            {/* Decorative gold ring between cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="absolute right-[38%] bottom-[30%] w-11 h-11 rounded-full border-2 border-gold/50 pointer-events-none"
            />

            {/* Session badge */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.95 }}
              className="absolute left-[40%] top-[44%] bg-forest/80 backdrop-blur-sm border border-gold/30 rounded-2xl px-4 py-2.5 shadow-lg"
            >
              <span className="font-display text-xl font-semibold text-cream">02</span>
              <p className="text-xs text-cream/70 mt-0.5 uppercase tracking-wider">Session</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-40 pointer-events-none hidden sm:flex">
        <span className="label-caps text-cream/60 text-xs">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-cream/60 to-transparent" />
      </div>
    </section>
  );
}
