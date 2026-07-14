import { getSiteStructuredData, serializeJsonLd } from "@/lib/seo";

export function SiteStructuredData() {
  return getSiteStructuredData().map((entity) => (
    <script
      key={entity["@id"]}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(entity) }}
    />
  ));
}
