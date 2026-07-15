"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/content/site";
import { approvedOffer, getOfferCopy, isOfferActiveAt, type SiteOffer } from "@/content/offers";

const MAX_TIMER_DELAY = 2_147_000_000;

export function OfferBanner({ locale, offer = approvedOffer }: { locale: Locale; offer?: SiteOffer }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const updateVisibility = () => {
      const now = Date.now();
      const startsAt = Date.parse(offer.startsAt);
      const endsAtExclusive = Date.parse(offer.endsAtExclusive);
      setVisible(isOfferActiveAt(offer, now));
      const nextTransition = now < startsAt ? startsAt : now < endsAtExclusive ? endsAtExclusive : null;
      if (nextTransition !== null && Number.isFinite(nextTransition)) {
        timer = window.setTimeout(updateVisibility, Math.min(Math.max(nextTransition - now, 0), MAX_TIMER_DELAY));
      }
    };
    updateVisibility();
    return () => { if (timer !== undefined) window.clearTimeout(timer); };
  }, [offer]);

  if (!visible) return null;

  const copy = getOfferCopy(offer, locale);
  return <aside className="offer-banner" aria-label={copy.headline}>
    <strong>{copy.headline}</strong>
    <span>{copy.supportingCopy}</span>
    <span className="offer-validity">{copy.validityCopy}</span>
    <small>{copy.terms}</small>
  </aside>;
}
