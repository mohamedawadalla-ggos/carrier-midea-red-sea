import type { RequestCartInquiry } from "@/types/lead";
import type { ProductFamily, ProductVariant, SupportedHorsepower } from "@/types/catalog";
import type { RequestCartItem, RequestCartPayload, ResolvedRequestCartItem } from "@/types/request-cart";

export const REQUEST_CART_STORAGE_KEY = "carrier-midea-request-cart";
export const REQUEST_CART_VERSION = 1 as const;
export const MAX_REQUEST_QUANTITY = 99;

function validQuantity(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) return null;
  return Math.min(value, MAX_REQUEST_QUANTITY);
}

export function sanitizeRequestCartItems(value: unknown, allowedVariantIds?: ReadonlySet<string>): RequestCartItem[] {
  if (!Array.isArray(value)) return [];
  const quantities = new Map<string, number>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") continue;
    const { variantId, quantity } = candidate as Record<string, unknown>;
    const safeQuantity = validQuantity(quantity);
    if (typeof variantId !== "string" || !variantId || (allowedVariantIds && !allowedVariantIds.has(variantId)) || safeQuantity === null) continue;
    quantities.set(variantId, Math.min((quantities.get(variantId) ?? 0) + safeQuantity, MAX_REQUEST_QUANTITY));
  }
  return [...quantities].map(([variantId, quantity]) => ({ variantId, quantity }));
}

export function parseRequestCart(raw: string | null, allowedVariantIds?: ReadonlySet<string>): RequestCartItem[] {
  if (!raw) return [];
  try {
    const payload = JSON.parse(raw) as Partial<RequestCartPayload>;
    if (!payload || payload.version !== REQUEST_CART_VERSION) return [];
    return sanitizeRequestCartItems(payload.items, allowedVariantIds);
  } catch {
    return [];
  }
}

export function serializeRequestCart(items: RequestCartItem[], allowedVariantIds?: ReadonlySet<string>): string {
  const payload: RequestCartPayload = { version: REQUEST_CART_VERSION, items: sanitizeRequestCartItems(items, allowedVariantIds) };
  return JSON.stringify(payload);
}

export function addRequestCartItem(items: RequestCartItem[], variantId: string, quantity = 1, allowedVariantIds?: ReadonlySet<string>): RequestCartItem[] {
  const safeItems = sanitizeRequestCartItems(items, allowedVariantIds);
  const safeQuantity = validQuantity(quantity);
  if (!variantId || (allowedVariantIds && !allowedVariantIds.has(variantId)) || safeQuantity === null) return safeItems;
  const existing = safeItems.find((item) => item.variantId === variantId);
  if (!existing) return [...safeItems, { variantId, quantity: safeQuantity }];
  return safeItems.map((item) => item.variantId === variantId
    ? { ...item, quantity: Math.min(item.quantity + safeQuantity, MAX_REQUEST_QUANTITY) }
    : item);
}

export function updateRequestCartItem(items: RequestCartItem[], variantId: string, quantity: number, allowedVariantIds?: ReadonlySet<string>): RequestCartItem[] {
  const safeItems = sanitizeRequestCartItems(items, allowedVariantIds);
  const safeQuantity = validQuantity(quantity);
  if (safeQuantity === null) return safeItems.filter((item) => item.variantId !== variantId);
  return safeItems.map((item) => item.variantId === variantId ? { ...item, quantity: safeQuantity } : item);
}

export function removeRequestCartItem(items: RequestCartItem[], variantId: string, allowedVariantIds?: ReadonlySet<string>): RequestCartItem[] {
  return sanitizeRequestCartItems(items, allowedVariantIds).filter((item) => item.variantId !== variantId);
}

export function clearRequestCart(): RequestCartItem[] {
  return [];
}

export function resolveRequestCartItems(items: RequestCartItem[], variants: ProductVariant[], families: ProductFamily[]): ResolvedRequestCartItem[] {
  const allowedVariantIds = new Set(variants.filter((variant) => variant.active).map((variant) => variant.id));
  return sanitizeRequestCartItems(items, allowedVariantIds).flatMap((item) => {
    const variant = variants.find((candidate) => candidate.id === item.variantId && candidate.active);
    const family = variant ? families.find((candidate) => candidate.id === variant.familyId) : undefined;
    return variant && family ? [{ ...item, variant, family }] : [];
  });
}

function formatCartHorsepower(locale: "ar" | "en", horsepower: SupportedHorsepower): string {
  const value = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2, useGrouping: false }).format(horsepower);
  return locale === "ar" ? `${value} حصان` : `${value} HP`;
}

export function buildRequestCartMessage(data: RequestCartInquiry): string {
  const ar = data.locale === "ar";
  const itemLines = data.items.map(({ family, variant, quantity }, index) => ar
    ? `${index + 1}. ${family.name.ar}\nكود الموديل: ${variant.modelCode}\nالقدرة: ${formatCartHorsepower("ar", variant.capacityHp)}\nالكمية: ${quantity}`
    : `${index + 1}. ${family.name.en}\nModel code: ${variant.modelCode}\nHorsepower: ${formatCartHorsepower("en", variant.capacityHp)}\nQuantity: ${quantity}`
  ).join("\n\n");
  return ar
    ? `طلب أجهزة تكييف\n\nالعميل: ${data.customerName}\nالهاتف: ${data.telephone}\nالمنطقة: ${data.area}\nالتركيب مطلوب: ${data.installationRequired ? "نعم" : "لا"}\nملاحظات إضافية: ${data.notes || "لا توجد"}\n\nالأجهزة المطلوبة:\n${itemLines}\n\nيتم تأكيد الأسعار والتوافر وتكلفة التركيب بعد مراجعة الطلب.`
    : `Air-conditioning request\n\nCustomer name: ${data.customerName}\nTelephone: ${data.telephone}\nArea: ${data.area}\nInstallation required: ${data.installationRequired ? "Yes" : "No"}\nAdditional notes: ${data.notes || "None"}\n\nRequested units:\n${itemLines}\n\nPrices, availability, and installation costs are confirmed after reviewing the request.`;
}
