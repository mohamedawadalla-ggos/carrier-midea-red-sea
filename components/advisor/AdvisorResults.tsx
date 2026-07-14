"use client";

import { advisorCopy, advisorReasonCopy } from "@/content/ac-advisor-copy";
import { productTypes } from "@/content/catalog-types";
import type { Locale } from "@/content/site";
import { formatHorsepower } from "@/lib/catalog-filtering";
import type { AcSizingResult, AdvisorCatalogMatch, AdvisorCatalogMatches } from "@/types/ac-advisor";

type Props = {
  locale: Locale;
  result: AcSizingResult;
  matches: AdvisorCatalogMatches;
  catalogUrl: string | null;
  customerName: string;
  selectedVariantId: string;
  whatsappAvailable: boolean;
  whatsappUnavailable: boolean;
  onCustomerNameChange: (value: string) => void;
  onSelectedVariantChange: (value: string) => void;
  onWhatsApp: (intent: "technical-confirmation" | "site-inspection") => void;
  onStartAgain: () => void;
};

function groupedByProductType(matches: AdvisorCatalogMatch[]): Array<[string, AdvisorCatalogMatch[]]> {
  const groups = new Map<string, AdvisorCatalogMatch[]>();
  for (const match of matches) groups.set(match.productType, [...(groups.get(match.productType) ?? []), match]);
  return [...groups.entries()];
}

export function AdvisorResults({ locale, result, matches, catalogUrl, customerName, selectedVariantId, whatsappAvailable, whatsappUnavailable, onCustomerNameChange, onSelectedVariantChange, onWhatsApp, onStartAgain }: Props) {
  const t = advisorCopy[locale];
  const number = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 1 });
  const btu = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 0 });
  const allMatches = [...matches.direct, ...matches.inspectionRequired];

  const renderGroups = (items: AdvisorCatalogMatch[]) => groupedByProductType(items).map(([typeId, group]) => {
    const type = productTypes.find((item) => item.id === typeId);
    return <section className="coolpet-product-group" key={typeId}>
      <h4>{type?.name[locale] ?? typeId}</h4>
      {group.map((match) => <article className="coolpet-match" key={match.family.id}>
        <div><strong>{match.family.name[locale]}</strong><span>{match.family.brand === "carrier" ? "Carrier" : "Midea"} · {match.family.technology === "inverter" ? "Inverter" : locale === "ar" ? "ثابت السرعة" : "Fixed speed"}</span></div>
        <p>{t.modelCodes}: {match.variants.map((variant) => variant.modelCode).join(", ")}</p>
        {match.reasons.map((reason) => <small key={reason.en}>{reason[locale]}</small>)}
        <a href={`/${locale}/products/${match.family.productType}/${match.family.slug}`}>{locale === "ar" ? "عرض العائلة" : "View family"}</a>
      </article>)}
    </section>;
  });

  return <div className="coolpet-results" aria-live="polite">
    <div className={`coolpet-result-status status-${result.inspectionLevel}`}>
      <h3 tabIndex={-1}>{t.resultTitle}</h3>
      <strong>{result.recommendedHp ? formatHorsepower(locale, result.recommendedHp) : t.noAutomaticHp}</strong>
      {result.alternativeHp && <span>{t.alternativeHp}: {formatHorsepower(locale, result.alternativeHp)}</span>}
      {result.inspectionLevel !== "none" && <span>{result.inspectionLevel === "required" ? (locale === "ar" ? "المعاينة الفنية مطلوبة" : "Technical inspection required") : (locale === "ar" ? "يوصى بالمعاينة الفنية" : "Technical inspection recommended")}</span>}
    </div>

    <dl className="coolpet-metrics">
      <div><dt>{t.area}</dt><dd>{number.format(result.areaSquareMeters)} m²</dd></div>
      <div><dt>{t.volume}</dt><dd>{number.format(result.volumeCubicMeters)} m³</dd></div>
      <div><dt>{t.baseLoad}</dt><dd>{btu.format(result.baseLoadBtu)} BTU</dd></div>
      <div><dt>{t.adjustedLoad}</dt><dd>{result.adjustedLoadBtu === null ? "—" : `${btu.format(result.adjustedLoadBtu)} BTU`}</dd></div>
    </dl>

    {result.reasons.length > 0 && <ul className="coolpet-reasons">{result.reasons.map((reason) => <li key={reason.code}>{advisorReasonCopy[reason.code][locale]}</li>)}</ul>}

    {matches.direct.length > 0 && <div className="coolpet-match-section"><h3>{t.directOptions}</h3>{renderGroups(matches.direct)}</div>}
    {matches.inspectionRequired.length > 0 && <div className="coolpet-match-section inspection"><h3>{t.inspectionOptions}</h3>{renderGroups(matches.inspectionRequired)}</div>}
    {result.recommendedHp && allMatches.length === 0 && <p className="coolpet-no-matches">{t.noMatches}</p>}

    {allMatches.length > 0 && <label className="coolpet-product-select">{t.selectProduct}<select value={selectedVariantId} onChange={(event) => onSelectedVariantChange(event.target.value)}><option value="">{t.noProduct}</option>{allMatches.flatMap((match) => match.variants.map((variant) => <option key={variant.id} value={variant.id}>{match.family.name[locale]} — {variant.modelCode}</option>))}</select></label>}
    <label className="coolpet-customer-name">{t.customerName}<input value={customerName} autoComplete="name" onChange={(event) => onCustomerNameChange(event.target.value)} /></label>

    <p className="coolpet-disclaimer">{t.disclaimer}</p>
    <p className="coolpet-privacy">{t.privacy}</p>
    <div className="coolpet-result-actions">
      {catalogUrl && <a className="coolpet-secondary" href={catalogUrl}>{t.viewProducts}</a>}
      <button type="button" className="coolpet-primary" disabled={!whatsappAvailable} onClick={() => onWhatsApp("technical-confirmation")}>{t.whatsapp}</button>
      <button type="button" className="coolpet-secondary" disabled={!whatsappAvailable} onClick={() => onWhatsApp("site-inspection")}>{t.inspection}</button>
      <button type="button" className="coolpet-reset" onClick={onStartAgain}>{t.startAgain}</button>
    </div>
    {(!whatsappAvailable || whatsappUnavailable) && <p className="coolpet-unavailable" role="status">{t.unavailable}</p>}
  </div>;
}
