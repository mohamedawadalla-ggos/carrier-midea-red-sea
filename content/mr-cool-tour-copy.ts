import type { LocalizedText } from "@/types/catalog";

export type TourStop = Readonly<{
  id: string;
  anchorId: string;
  text: LocalizedText;
}>;

export const tourGreetingPrompt: LocalizedText = {
  ar: "أهلاً! أنا مستر كول 👋 حابب أوريك الموقع في دقيقة واحدة؟",
  en: "Hi! I'm Mr. Cool 👋 Want a 60-second tour of the site?",
};

export const tourStops: readonly TourStop[] = [
  {
    id: "hp-picker",
    anchorId: "best-selling-products",
    text: {
      ar: "من هنا تختار تكييفك على حسب القدرة بالحصان، وتشوف السعر الحالي فورًا.",
      en: "Pick your AC by horsepower here, and see the current price right away.",
    },
  },
  {
    id: "catalog",
    anchorId: "featured-products-title",
    text: {
      ar: "وده الكتالوج الكامل لكل عائلات كاريير وميديا لو حابب تستكشف أكتر.",
      en: "This is the full catalog of Carrier and Midea families if you want to browse more.",
    },
  },
  {
    id: "services",
    anchorId: "services",
    text: {
      ar: "إحنا مش بس بنبيع تكييفات — بنركّب ونقوم بصيانة ونصلح كمان.",
      en: "We don't just sell ACs — we install, maintain, and repair them too.",
    },
  },
  {
    id: "coverage",
    anchorId: "coverage",
    text: {
      ar: "دي مناطق التغطية بتاعتنا على ساحل البحر الأحمر وخليج السويس.",
      en: "Here's our service coverage along the Red Sea and Gulf of Suez coast.",
    },
  },
  {
    id: "contact",
    anchorId: "contact",
    text: {
      ar: "لو محتاج أي حاجة، ابعتلنا من هنا وهيتواصل معاك فريقنا فورًا. جاهز؟",
      en: "Need anything? Send us a message here and our team will reach out. Ready to explore?",
    },
  },
];
