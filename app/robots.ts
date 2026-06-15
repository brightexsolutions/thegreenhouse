import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/events", "/gallery", "/get-involved"],
        disallow: ["/admin", "/api", "/checkin", "/ticket", "/live", "/feedback", "/docs"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
