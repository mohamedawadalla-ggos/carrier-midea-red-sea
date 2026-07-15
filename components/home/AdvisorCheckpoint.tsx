"use client";

import type { Locale } from "@/content/site";
import { advisorCopy } from "@/content/ac-advisor-copy";
import { openCoolPetAdvisor } from "@/lib/ac-advisor-access";

export function AdvisorCheckpoint({ locale }: { locale: Locale }) {
  const t = advisorCopy[locale];
  return <section className="section advisor-checkpoint" aria-labelledby="advisor-checkpoint-title">
    <div>
      <p className="kicker">{t.checkpointKicker}</p>
      <h2 id="advisor-checkpoint-title">{t.checkpointTitle}</h2>
      <p>{t.checkpointCopy}</p>
    </div>
    <button className="btn primary" type="button" aria-haspopup="dialog" onClick={(event) => openCoolPetAdvisor(event.currentTarget)}>
      {t.checkpointCta}<span>↗</span>
    </button>
  </section>;
}
