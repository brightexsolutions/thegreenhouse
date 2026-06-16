import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PARTNERS, SITE_NAME } from "@/lib/constants";
import { FadeIn } from "@/components/motion/fade-in";
import { PartnersCarousel } from "@/components/home/partners-carousel";
import { createAdminClient } from "@/lib/supabase/server";

async function getSiteName(): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "site_name")
      .single();
    return data?.value || SITE_NAME;
  } catch {
    return SITE_NAME;
  }
}

export async function PartnersStrip() {
  if (!PARTNERS.length) return null;

  const siteName = await getSiteName();

  return (
    <section className="py-14 md:py-16 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <FadeIn>
          <div className="flex items-center gap-4 mb-10">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/25" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-charcoal/40 font-semibold">
              Partners &amp; Supporters
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/25" />
          </div>
        </FadeIn>

        {/* Carousel */}
        <FadeIn delay={0.1}>
          <PartnersCarousel partners={PARTNERS} />
        </FadeIn>

        {/* Partner CTA */}
        <FadeIn delay={0.25}>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
            <p className="text-sm text-charcoal/55 font-medium">
              Want to partner with {siteName}?
            </p>
            <Link
              href="/get-involved?interest=partner"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors shadow-sm"
            >
              Get in touch
              <ArrowRight size={13} />
            </Link>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
