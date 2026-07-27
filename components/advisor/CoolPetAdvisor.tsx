"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdvisorDialog } from "@/components/advisor/AdvisorDialog";
import { AdvisorQuestionFlow } from "@/components/advisor/AdvisorQuestionFlow";
import { AdvisorResults } from "@/components/advisor/AdvisorResults";
import { CoolPetMascot, type CoolPetState } from "@/components/advisor/CoolPetMascot";
import { advisorCopy } from "@/content/ac-advisor-copy";
import { acSizingConfig } from "@/content/ac-sizing-config";
import { tourGreetingPrompt, tourStops } from "@/content/mr-cool-tour-copy";
import { productFamilies } from "@/content/product-families";
import { productVariants } from "@/content/product-variants";
import type { Locale } from "@/content/site";
import { buildAdvisorCatalogUrl, matchAdvisorCatalog } from "@/lib/ac-advisor-matching";
import { OPEN_COOLPET_ADVISOR_EVENT, type OpenCoolPetAdvisorDetail } from "@/lib/ac-advisor-access";
import { calculateAcSizing } from "@/lib/ac-sizing";
import { hasTourBeenSeen, markTourSeen } from "@/lib/mr-cool-tour";
import { siteConfig } from "@/lib/site-config";
import { openPreparedLink } from "@/lib/whatsapp";
import { leadProvider } from "@/services/leads/whatsapp-provider";
import type { AcSizingInput, AcSizingResult } from "@/types/ac-advisor";

const TOUR_PROMPT_DELAY_MS = 2500;

function initialInput(locale: Locale): AcSizingInput {
  return {
    locale,
    location: "hurghada",
    lengthMeters: 4,
    widthMeters: 4,
    ceilingHeightMeters: 2.7,
    roomType: "bedroom",
    sunlight: "normal",
    floorCondition: "normal-floor",
    glazing: "normal",
    insulation: "average",
    occupants: 2,
    coolingModePreference: "either",
    technologyPreference: "either",
    brandPreference: "either",
    installationPreference: "unsure-show-all-suitable",
    connectedRooms: false,
    irregularGeometry: false,
    highEquipmentHeatLoad: false,
  };
}

function validateMeasurements(locale: Locale, input: AcSizingInput): string[] {
  const ar = locale === "ar";
  const errors: string[] = [];
  if (!Number.isFinite(input.lengthMeters) || input.lengthMeters < 2) errors.push(ar ? "يجب ألا يقل الطول عن ٢ متر." : "Length must be at least 2 metres.");
  if (!Number.isFinite(input.widthMeters) || input.widthMeters < 2) errors.push(ar ? "يجب ألا يقل العرض عن ٢ متر." : "Width must be at least 2 metres.");
  if (!Number.isFinite(input.ceilingHeightMeters) || input.ceilingHeightMeters < 2.4) errors.push(ar ? "يجب ألا يقل ارتفاع السقف عن ٢٫٤ متر." : "Ceiling height must be at least 2.4 metres.");
  if (!Number.isInteger(input.occupants) || input.occupants < 1) errors.push(ar ? "أدخل عددًا صحيحًا للأشخاص لا يقل عن ١." : "Enter a whole number of at least 1 occupant.");
  return errors;
}

export function CoolPetAdvisor({ locale }: { locale: Locale }) {
  const t = advisorCopy[locale];
  const launcherRef = useRef<HTMLButtonElement>(null);
  const externalOpenerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<AcSizingInput>(() => initialInput(locale));
  const [result, setResult] = useState<AcSizingResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [whatsappUnavailable, setWhatsappUnavailable] = useState(false);
  const [tourPhase, setTourPhase] = useState<"hidden" | "prompt" | "touring">("hidden");
  const [tourStep, setTourStep] = useState(0);

  const matches = useMemo(() => matchAdvisorCatalog(input, result?.recommendedHp ?? null, productFamilies, productVariants, acSizingConfig.inspectionProductTypes), [input, result]);
  const catalogUrl = result?.recommendedHp ? buildAdvisorCatalogUrl(locale, input, result.recommendedHp) : null;
  const allMatches = [...matches.direct, ...matches.inspectionRequired];
  const selectedMatch = allMatches.find((match) => match.variants.some((variant) => variant.id === selectedVariantId));
  const selectedVariant = selectedMatch?.variants.find((variant) => variant.id === selectedVariantId);

  const mascotState: CoolPetState = !open ? "idle" : result ? (result.inspectionLevel === "required" ? "site-inspection-needed" : "recommendation-ready") : step === 0 ? "greeting" : step < 3 ? "measuring" : "thinking";

  useEffect(() => {
    const handleOpen = (event: Event): void => {
      externalOpenerRef.current = (event as CustomEvent<OpenCoolPetAdvisorDetail>).detail?.opener ?? null;
      setOpen(true);
    };
    window.addEventListener(OPEN_COOLPET_ADVISOR_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_COOLPET_ADVISOR_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (open || hasTourBeenSeen()) return;
    const timer = window.setTimeout(() => setTourPhase("prompt"), TOUR_PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (tourPhase !== "touring" || open) return;
    const stop = tourStops[tourStep];
    if (!stop) return;
    document.getElementById(stop.anchorId)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [tourPhase, tourStep, open]);

  useEffect(() => {
    if (tourPhase === "hidden" || open) return;
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      endTour();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [tourPhase, open]);

  function startTour(): void {
    setTourStep(0);
    setTourPhase("touring");
  }

  function endTour(): void {
    markTourSeen();
    setTourPhase("hidden");
  }

  function advanceTour(): void {
    if (tourStep + 1 < tourStops.length) setTourStep((current) => current + 1);
    else endTour();
  }

  function reset(): void {
    setStep(0);
    setInput(initialInput(locale));
    setResult(null);
    setErrors([]);
    setCustomerName("");
    setSelectedVariantId("");
    setWhatsappUnavailable(false);
  }

  function close(): void {
    const focusTarget = externalOpenerRef.current ?? launcherRef.current;
    externalOpenerRef.current = null;
    setOpen(false);
    window.setTimeout(() => focusTarget?.focus(), 0);
  }

  function advance(): void {
    if (step === 1) {
      const nextErrors = validateMeasurements(locale, input);
      setErrors(nextErrors);
      if (nextErrors.length > 0) return;
    }
    setErrors([]);
    if (step < 3) setStep((current) => current + 1);
    else {
      const sizingResult = calculateAcSizing(input, acSizingConfig);
      const initialMatches = matchAdvisorCatalog(input, sizingResult.recommendedHp, productFamilies, productVariants, acSizingConfig.inspectionProductTypes);
      setResult(initialMatches.conflictingPreferences ? {
        ...sizingResult,
        confidence: "site-inspection-required",
        inspectionLevel: "required",
        reasons: [...sizingResult.reasons, { code: "conflicting-preferences", level: "required" }],
      } : sizingResult);
      setSelectedVariantId("");
      setStep(4);
    }
  }

  async function sendWhatsApp(intent: "technical-confirmation" | "site-inspection"): Promise<void> {
    if (!result) return;
    const opened = await openPreparedLink(leadProvider.submitAcAdvisorInquiry({ locale, intent, customerName: customerName.trim(), input, result, selectedFamily: selectedMatch?.family, selectedVariant }));
    setWhatsappUnavailable(!opened);
  }

  return <div className="coolpet-advisor" dir={locale === "ar" ? "rtl" : "ltr"}>
    <div className="coolpet-launcher-group">
      <button ref={launcherRef} className="coolpet-launcher" type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={`${t.launcher} — ${locale === "ar" ? "احسب القدرة المناسبة" : "Estimate the right capacity"}`} onClick={() => setOpen(true)}>
        <CoolPetMascot locale={locale} state={mascotState} compact />
        <span className="coolpet-launcher-tooltip" aria-hidden="true"><strong>{t.launcher}</strong><small>{locale === "ar" ? "احسب القدرة المناسبة" : "Estimate the right capacity"}</small></span>
      </button>
      <button type="button" className="coolpet-tour-replay" aria-label={locale === "ar" ? "أعد عرض جولة الموقع" : "Replay the site tour"} onClick={startTour}>؟</button>
    </div>
    {tourPhase !== "hidden" && !open && <div className="coolpet-tour-bubble" role="dialog" aria-live="polite" aria-label={locale === "ar" ? "جولة مستر كول" : "Mr. Cool's tour"}>
      {tourPhase === "prompt" ? <>
        <p>{tourGreetingPrompt[locale]}</p>
        <div className="coolpet-tour-bubble-actions">
          <button type="button" className="coolpet-tour-secondary" onClick={endTour}>{locale === "ar" ? "لأ شكرًا" : "No thanks"}</button>
          <button type="button" className="coolpet-tour-primary" onClick={startTour}>{locale === "ar" ? "أيوة، وريني" : "Yes, show me"}</button>
        </div>
      </> : <>
        <span className="coolpet-tour-bubble-progress">{tourStep + 1}/{tourStops.length}</span>
        <p>{tourStops[tourStep].text[locale]}</p>
        <div className="coolpet-tour-bubble-actions">
          <button type="button" className="coolpet-tour-secondary" onClick={endTour}>{locale === "ar" ? "تخطي" : "Skip tour"}</button>
          <button type="button" className="coolpet-tour-primary" onClick={advanceTour}>{tourStep + 1 === tourStops.length ? (locale === "ar" ? "تمام!" : "Got it!") : (locale === "ar" ? "التالي" : "Next")}</button>
        </div>
      </>}
    </div>}
    <AdvisorDialog locale={locale} open={open} titleId="coolpet-title" onClose={close}>
      <header className="coolpet-dialog-header">
        <CoolPetMascot locale={locale} state={mascotState} />
        <div><h2 id="coolpet-title">{t.title}</h2><p>{t.intro}</p></div>
      </header>
      <div className="coolpet-progress" aria-label={t.progress.replace("{current}", String(step + 1))}>
        <span>{t.progress.replace("{current}", String(step + 1))}</span>
        <progress value={step + 1} max={5}>{step + 1}/5</progress>
        <ol>{t.steps.map((label, index) => <li key={label} aria-current={index === step ? "step" : undefined}>{label}</li>)}</ol>
      </div>
      {step < 4 ? <AdvisorQuestionFlow locale={locale} step={step} input={input} errors={errors} onChange={(patch) => setInput((current) => ({ ...current, ...patch }))} /> : result && <AdvisorResults locale={locale} result={result} matches={matches} catalogUrl={catalogUrl} customerName={customerName} selectedVariantId={selectedVariantId} whatsappAvailable={Boolean(siteConfig.whatsappNumber)} whatsappUnavailable={whatsappUnavailable} onCustomerNameChange={setCustomerName} onSelectedVariantChange={setSelectedVariantId} onWhatsApp={sendWhatsApp} onStartAgain={reset} />}
      {step < 4 && <footer className="coolpet-navigation">
        <button type="button" className="coolpet-secondary" disabled={step === 0} onClick={() => { setErrors([]); setStep((current) => Math.max(0, current - 1)); }}>{t.back}</button>
        <button type="button" className="coolpet-primary" onClick={advance}>{step === 3 ? t.calculate : t.next}</button>
      </footer>}
    </AdvisorDialog>
  </div>;
}
