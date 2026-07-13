import type { ProductType } from "@/types/catalog";

export const productTypes: ProductType[] = [
  { id: "wall-mounted-split", name: { ar: "تكييفات سبليت حائطية", en: "Wall-mounted split AC" }, description: { ar: "حلول حائطية للمنازل والمساحات المختلفة.", en: "Wall-mounted solutions for homes and varied spaces." }, displayOrder: 1 },
  { id: "concealed-ducted", name: { ar: "تكييفات مخفية ودكت", en: "Concealed and ducted AC" }, description: { ar: "وحدات مخفية لتوزيع الهواء عبر مجاري الهواء.", en: "Concealed systems distributing air through ducts." }, displayOrder: 2 },
  { id: "ceiling-cassette", name: { ar: "تكييفات كاسيت سقفية", en: "Ceiling cassette AC" }, description: { ar: "وحدات كاسيت مدمجة في السقف.", en: "Cassette units integrated into the ceiling." }, displayOrder: 3 },
  { id: "floor-standing", name: { ar: "تكييفات دولابي", en: "Floor-standing AC" }, description: { ar: "وحدات دولابي للمساحات التي تحتاج تدفق هواء قوي.", en: "Floor-standing units for spaces needing strong airflow." }, displayOrder: 4 },
];
