import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export type SocialLinks = {
  instagram: string;
  tiktok:    string;
  youtube:   string;
  facebook:  string;
  twitter:   string;
};

const SOCIAL_KEYS = ["social_instagram", "social_tiktok", "social_youtube", "social_facebook", "social_twitter"] as const;

const fetchSocialLinks = unstable_cache(
  async (): Promise<SocialLinks> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [...SOCIAL_KEYS]);

    const map = Object.fromEntries((data ?? []).map(r => [r.key, r.value ?? ""]));
    return {
      instagram: map["social_instagram"] ?? "",
      tiktok:    map["social_tiktok"]    ?? "",
      youtube:   map["social_youtube"]   ?? "",
      facebook:  map["social_facebook"]  ?? "",
      twitter:   map["social_twitter"]   ?? "",
    };
  },
  ["social-links"],
  { revalidate: 3600, tags: ["site-settings"] }
);

// React cache deduplicates within a single render (layout + footer share one fetch)
export const getSocialLinks = cache(fetchSocialLinks);
