import type { Metadata } from "next";
import { SiteExperience } from "@/components/SiteExperience";
import { content } from "@/content/site";
import { defaultArabicAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "كاريير ميديا البحر الأحمر | بيع وتركيب وصيانة التكييفات",
  description: content.ar.intro,
  alternates: defaultArabicAlternates,
};

export default function Home() { return <SiteExperience initialLocale="ar" />; }
