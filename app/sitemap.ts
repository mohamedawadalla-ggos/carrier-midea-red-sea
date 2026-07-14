import type { MetadataRoute } from "next";
import { canonicalSitePaths, canonicalUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return canonicalSitePaths.map((path) => ({ url: canonicalUrl(path) }));
}
