"use client";

import { trackSocialClick } from "@/lib/social-tracking";

export function FacebookShareButton({ url, label }: { url: string; label: string }) {
  if (!url.startsWith("http")) return null;
  const href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  return <a className="facebook-share" href={href} target="_blank" rel="noreferrer" onClick={() => trackSocialClick("facebook_share_click")}>f&nbsp; {label}</a>;
}
