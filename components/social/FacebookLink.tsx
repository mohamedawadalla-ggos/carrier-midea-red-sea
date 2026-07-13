"use client";

import type { ReactNode } from "react";
import { trackSocialClick, type SocialEventName } from "@/lib/social-tracking";

type FacebookLinkProps = {
  href: string;
  event: SocialEventName;
  className?: string;
  children: ReactNode;
};

export function FacebookLink({ href, event, className, children }: FacebookLinkProps) {
  if (!href) return null;
  return <a className={className} href={href} target="_blank" rel="noreferrer" onClick={() => trackSocialClick(event)}>{children}</a>;
}
