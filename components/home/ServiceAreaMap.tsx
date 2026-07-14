/* eslint-disable @next/next/no-img-element -- static export uses a local, documented Natural Earth SVG. */
import type { Locale } from "@/content/site";

const cities = [
  { id: "ain-sokhna", ar: "العين السخنة", en: "Ain Sokhna", x: 16.01, y: 9.89 },
  { id: "ras-ghareb", ar: "رأس غارب", en: "Ras Ghareb", x: 30.95, y: 23.54 },
  { id: "el-gouna", ar: "الجونة", en: "El Gouna", x: 42.71, y: 34.13 },
  { id: "hurghada", ar: "الغردقة", en: "Hurghada", x: 45.33, y: 35.63 },
  { id: "safaga", ar: "سفاجا", en: "Safaga", x: 47.76, y: 41.21 },
  { id: "quseir", ar: "القصير", en: "Quseir", x: 54.47, y: 48.30 },
  { id: "marsa-alam", ar: "مرسى علم", en: "Marsa Alam", x: 66.25, y: 59.70 },
] as const;

export function ServiceAreaMap({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  return <figure className="service-area-map">
    <div className="coverage-map-canvas">
      <img src="/maps/red-sea-service-coverage.svg" alt={ar ? "خريطة توضيحية لخليج السويس وساحل البحر الأحمر" : "Indicative map of the Gulf of Suez and Red Sea coast"} width={720} height={760} />
      <span className="coverage-map-region">{ar ? "خليج السويس • البحر الأحمر" : "GULF OF SUEZ • RED SEA"}</span>
      <ol className="coverage-markers" aria-label={ar ? "مواقع نطاق الخدمة" : "Service coverage locations"}>
        {cities.map((city) => <li className={`coverage-marker marker-${city.id}`} key={city.id} style={{ left: `${city.x}%`, top: `${city.y}%` }}><span>{city[locale]}</span></li>)}
      </ol>
    </div>
    <figcaption>{ar ? "خريطة توضيحية لنطاق الخدمة وليست مخصصة للملاحة" : "Indicative service coverage map — not for navigation"}</figcaption>
  </figure>;
}
