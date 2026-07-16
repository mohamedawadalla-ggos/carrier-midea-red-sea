import type { Locale } from "@/content/site";

export type CoolPetState = "idle" | "greeting" | "measuring" | "thinking" | "recommendation-ready" | "site-inspection-needed";

export function CoolPetMascot({ locale, state, compact = false }: { locale: Locale; state: CoolPetState; compact?: boolean }) {
  const label = locale === "ar" ? "شخصية مستر كول المرحة لاختيار التكييف" : "Mr. Cool playful air-conditioning advisor character";
  return <svg className={`coolpet-mascot state-${state}${compact ? " compact" : ""}`} viewBox="0 0 140 112" role="img" aria-label={label}>
    <path className="coolpet-arm" d="M18 55 7 47m111 8 12-9" />
    <path className="coolpet-hand" d="m7 47-1-7m1 7-7-1m130 0 1-7m-1 7 7-2" />
    <rect className="coolpet-shell-shadow" x="17" y="22" width="104" height="67" rx="23" />
    <rect className="coolpet-shell" x="14" y="18" width="104" height="67" rx="23" />
    <path className="coolpet-panel" d="M24 31c22-6 62-6 84 0v31H24z" />
    <path className="coolpet-brow" d="m39 42 9-2m28 0 9 2" />
    <ellipse className="coolpet-eye" cx="45" cy="49" rx="3.5" ry="4.5" />
    <ellipse className="coolpet-eye" cx="80" cy="49" rx="3.5" ry="4.5" />
    <circle className="coolpet-cheek" cx="35" cy="57" r="4" />
    <circle className="coolpet-cheek" cx="91" cy="57" r="4" />
    <path className="coolpet-smile" d="M51 57c7 8 18 8 25 0" />
    <path className="coolpet-vent" d="M31 70h70m-62 5h54" />
    <path className="coolpet-foot" d="M37 88v6m55-6v6" />
    <path className="coolpet-bow" d="m55 88 9 6-9 7-6-7zm18 0-9 6 9 7 6-7z" />
    <circle className="coolpet-bow-knot" cx="64" cy="94" r="4" />
    <path className="coolpet-air air-one" d="M20 104c8-7 15-7 23 0" />
    <path className="coolpet-air air-two" d="M86 104c8-7 15-7 23 0" />
    <g className="coolpet-ruler"><path d="M108 64l16 20-8 6-16-20z" /><path d="m109 70 5-4m-1 9 5-4m-1 9 5-4" /></g>
    <g className="coolpet-ready"><circle cx="111" cy="24" r="12" /><path d="m105 24 4 4 8-9" /></g>
    <g className="coolpet-inspection"><circle cx="111" cy="24" r="12" /><path d="M106 27v-7h10v7m-12 0h14" /></g>
    <g className="coolpet-dots"><circle cx="55" cy="108" r="2" /><circle cx="64" cy="108" r="2" /><circle cx="73" cy="108" r="2" /></g>
  </svg>;
}
