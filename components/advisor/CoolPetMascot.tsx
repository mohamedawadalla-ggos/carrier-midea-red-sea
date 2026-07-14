import type { Locale } from "@/content/site";

export type CoolPetState = "idle" | "greeting" | "measuring" | "thinking" | "recommendation-ready" | "site-inspection-needed";

export function CoolPetMascot({ locale, state, compact = false }: { locale: Locale; state: CoolPetState; compact?: boolean }) {
  return <svg className={`coolpet-mascot state-${state}${compact ? " compact" : ""}`} viewBox="0 0 120 96" role="img" aria-label={locale === "ar" ? "شخصية كول بيت المساعدة لاختيار التكييف" : "CoolPet air-conditioning advisor character"}>
    <rect className="coolpet-shell" x="12" y="17" width="96" height="58" rx="17" />
    <path className="coolpet-panel" d="M22 29h76v28H22z" />
    <circle className="coolpet-eye" cx="43" cy="42" r="3" />
    <circle className="coolpet-eye" cx="77" cy="42" r="3" />
    <path className="coolpet-smile" d="M49 49c6 5 16 5 22 0" />
    <path className="coolpet-vent" d="M29 63h62" />
    <path className="coolpet-air air-one" d="M36 82c7-6 13-6 20 0" />
    <path className="coolpet-air air-two" d="M65 82c7-6 13-6 20 0" />
    <g className="coolpet-ruler"><path d="M97 58l13 18-7 5-13-18z" /><path d="M99 64l4-3m-1 8 4-3m-1 8 4-3" /></g>
    <g className="coolpet-ready"><circle cx="98" cy="22" r="12" /><path d="m92 22 4 4 8-9" /></g>
    <g className="coolpet-inspection"><circle cx="98" cy="22" r="12" /><path d="M93 25v-7h10v7m-12 0h14" /></g>
    <g className="coolpet-dots"><circle cx="50" cy="91" r="2" /><circle cx="60" cy="91" r="2" /><circle cx="70" cy="91" r="2" /></g>
  </svg>;
}
