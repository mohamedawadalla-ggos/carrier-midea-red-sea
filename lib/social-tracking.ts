import { siteConfig } from "@/lib/site-config";

export type SocialEventName =
  | "facebook_header_click"
  | "facebook_home_section_click"
  | "facebook_footer_click"
  | "facebook_share_click";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (command: string, event: string, name: string) => void;
  }
}

function hasMarketingConsent(): boolean {
  try {
    return window.localStorage.getItem("marketing_consent") === "granted";
  } catch {
    return false;
  }
}

export function trackSocialClick(event: SocialEventName): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(event));
  window.dataLayer?.push({ event });

  if (siteConfig.metaPixelId && hasMarketingConsent() && window.fbq) {
    window.fbq("trackCustom", "FacebookFollowClick", event);
  }
}
