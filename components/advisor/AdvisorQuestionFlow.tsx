"use client";

import { advisorCopy, advisorOptions } from "@/content/ac-advisor-copy";
import type { Locale } from "@/content/site";
import type { AcSizingInput } from "@/types/ac-advisor";

type Props = {
  locale: Locale;
  step: number;
  input: AcSizingInput;
  errors: string[];
  onChange: (patch: Partial<AcSizingInput>) => void;
};

export function AdvisorQuestionFlow({ locale, step, input, errors, onChange }: Props) {
  const t = advisorCopy[locale];
  const label = (text: { ar: string; en: string }) => text[locale];

  return <div className="coolpet-questions">
    {errors.length > 0 && <div className="coolpet-errors" role="alert"><strong>{locale === "ar" ? "يرجى مراجعة البيانات:" : "Please review the inputs:"}</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}

    {step === 0 && <fieldset>
      <legend>{t.steps[0]}</legend>
      <label>{t.location}<select value={input.location} onChange={(event) => onChange({ location: event.target.value as AcSizingInput["location"] })}>{advisorOptions.locations.map(([value, text]) => <option key={value} value={value}>{label(text)}</option>)}</select></label>
      <label>{t.roomType}<select value={input.roomType} onChange={(event) => onChange({ roomType: event.target.value as AcSizingInput["roomType"] })}>{advisorOptions.roomTypes.map(([value, text]) => <option key={value} value={value}>{label(text)}</option>)}</select></label>
      <label>{t.installation}<select value={input.installationPreference} onChange={(event) => onChange({ installationPreference: event.target.value as AcSizingInput["installationPreference"] })}>{advisorOptions.installationTypes.map(([value, text]) => <option key={value} value={value}>{label(text)}</option>)}</select></label>
    </fieldset>}

    {step === 1 && <fieldset>
      <legend>{t.steps[1]}</legend>
      <div className="coolpet-number-grid">
        <label>{t.length}<input type="number" inputMode="decimal" min="2" step="0.1" value={input.lengthMeters} onChange={(event) => onChange({ lengthMeters: Number(event.target.value) })} /></label>
        <label>{t.width}<input type="number" inputMode="decimal" min="2" step="0.1" value={input.widthMeters} onChange={(event) => onChange({ widthMeters: Number(event.target.value) })} /></label>
        <label>{t.height}<input type="number" inputMode="decimal" min="2.4" step="0.1" value={input.ceilingHeightMeters} onChange={(event) => onChange({ ceilingHeightMeters: Number(event.target.value) })} /></label>
        <label>{t.occupants}<input type="number" inputMode="numeric" min="1" step="1" value={input.occupants} onChange={(event) => onChange({ occupants: Number(event.target.value) })} /></label>
      </div>
      <p className="coolpet-hint">{locale === "ar" ? "الأبعاد الأكبر من ١٢م، والارتفاع الأكبر من ٣٫٦م، والمساحات الأكبر من ٦٠م² تحتاج إلى معاينة." : "Dimensions over 12m, ceilings over 3.6m, and areas over 60m² require inspection."}</p>
    </fieldset>}

    {step === 2 && <fieldset>
      <legend>{t.steps[2]}</legend>
      <label>{t.sunlight}<select value={input.sunlight} onChange={(event) => onChange({ sunlight: event.target.value as AcSizingInput["sunlight"] })}><option value="low">{locale === "ar" ? "منخفض / ظل كثيف" : "Low / heavily shaded"}</option><option value="normal">{locale === "ar" ? "طبيعي" : "Normal"}</option><option value="high">{locale === "ar" ? "شمس قوية مباشرة" : "High / strong direct sun"}</option></select></label>
      <label>{t.floor}<select value={input.floorCondition} onChange={(event) => onChange({ floorCondition: event.target.value as AcSizingInput["floorCondition"] })}><option value="normal-floor">{locale === "ar" ? "دور عادي" : "Normal floor"}</option><option value="top-floor-insulated">{locale === "ar" ? "دور أخير وسطح معزول" : "Top floor with insulated roof"}</option><option value="roof-exposed-poor-insulation">{locale === "ar" ? "سطح مكشوف وعزل ضعيف" : "Exposed roof with poor insulation"}</option></select></label>
      <label>{t.glazing}<select value={input.glazing} onChange={(event) => onChange({ glazing: event.target.value as AcSizingInput["glazing"] })}><option value="small">{locale === "ar" ? "نوافذ صغيرة" : "Small windows"}</option><option value="normal">{locale === "ar" ? "نوافذ عادية" : "Normal windows"}</option><option value="large">{locale === "ar" ? "زجاج كبير" : "Large glazing"}</option><option value="full-storefront">{locale === "ar" ? "واجهة زجاج كاملة" : "Full storefront glazing"}</option></select></label>
      <label>{t.insulation}<select value={input.insulation} onChange={(event) => onChange({ insulation: event.target.value as AcSizingInput["insulation"] })}><option value="good">{locale === "ar" ? "جيد" : "Good"}</option><option value="average">{locale === "ar" ? "متوسط" : "Average"}</option><option value="poor">{locale === "ar" ? "ضعيف" : "Poor"}</option><option value="unknown">{locale === "ar" ? "غير معروف" : "Unknown"}</option></select></label>
    </fieldset>}

    {step === 3 && <fieldset>
      <legend>{t.steps[3]}</legend>
      <label>{t.coolingMode}<select value={input.coolingModePreference} onChange={(event) => onChange({ coolingModePreference: event.target.value as AcSizingInput["coolingModePreference"] })}><option value="either">{locale === "ar" ? "أي نظام" : "Either"}</option><option value="cool-only">{locale === "ar" ? "بارد فقط" : "Cool only"}</option><option value="heat-pump">{locale === "ar" ? "بارد / ساخن" : "Cool & heat"}</option></select></label>
      <label>{t.technology}<select value={input.technologyPreference} onChange={(event) => onChange({ technologyPreference: event.target.value as AcSizingInput["technologyPreference"] })}><option value="either">{locale === "ar" ? "أي تقنية" : "Either"}</option><option value="inverter">Inverter</option><option value="fixed-speed">{locale === "ar" ? "ثابت السرعة" : "Fixed speed"}</option></select></label>
      <label>{t.brand}<select value={input.brandPreference} onChange={(event) => onChange({ brandPreference: event.target.value as AcSizingInput["brandPreference"] })}><option value="either">{locale === "ar" ? "كاريير أو ميديا" : "Carrier or Midea"}</option><option value="carrier">Carrier</option><option value="midea">Midea</option></select></label>
      <div className="coolpet-checks">
        <label><input type="checkbox" checked={input.connectedRooms} onChange={(event) => onChange({ connectedRooms: event.target.checked })} />{t.connectedRooms}</label>
        <label><input type="checkbox" checked={input.irregularGeometry} onChange={(event) => onChange({ irregularGeometry: event.target.checked })} />{t.irregularGeometry}</label>
        <label><input type="checkbox" checked={input.highEquipmentHeatLoad} onChange={(event) => onChange({ highEquipmentHeatLoad: event.target.checked })} />{t.highEquipmentLoad}</label>
      </div>
    </fieldset>}
  </div>;
}
