import { getSupabase } from "@/lib/supabase";
import type { AuditRecord, CatalogProduct, DiscountCampaign, PriceEntry, PublishedPrice, ServiceLocation, ServiceLocationRevision, SiteSetting, StaffProfile, Warehouse } from "@/lib/types";

export type ControlPanelSnapshot = {
  profile: StaffProfile;
  products: CatalogProduct[];
  priceEntries: PriceEntry[];
  publishedPrices: PublishedPrice[];
  discounts: DiscountCampaign[];
  settings: SiteSetting[];
  locations: ServiceLocation[];
  locationRevisions: ServiceLocationRevision[];
  warehouses: Warehouse[];
  audit: AuditRecord[];
};

async function requireData<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>, label: string): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  if (data === null) throw new Error(`${label}: no data returned`);
  return data;
}

export async function loadSnapshot(userId: string): Promise<ControlPanelSnapshot> {
  const supabase = getSupabase();
  const [profile, products, priceEntries, publishedPrices, discounts, settings, locations, locationRevisions, warehouses, audit] = await Promise.all([
    requireData<StaffProfile>(supabase.from("staff_profiles").select("user_id,full_name,role,active").eq("user_id", userId).single(), "Profile"),
    requireData<CatalogProduct[]>(supabase.from("catalog_products").select("*").order("brand").order("family_name_en").order("capacity_hp"), "Products"),
    requireData<PriceEntry[]>(supabase.from("product_price_entries").select("*").order("updated_at", { ascending: false }), "Price entries"),
    requireData<PublishedPrice[]>(supabase.from("published_product_prices").select("*").order("model_code"), "Published prices"),
    requireData<DiscountCampaign[]>(supabase.from("discount_campaigns").select("*").order("starts_at", { ascending: false }), "Discounts"),
    requireData<SiteSetting[]>(supabase.from("site_settings").select("*").order("category").order("key"), "Settings"),
    requireData<ServiceLocation[]>(supabase.from("service_locations").select("*").order("display_order"), "Locations"),
    requireData<ServiceLocationRevision[]>(supabase.from("service_location_revisions").select("*").order("created_at", { ascending: false }), "Location revisions"),
    requireData<Warehouse[]>(supabase.from("warehouses").select("*").order("code"), "Warehouses"),
    requireData<AuditRecord[]>(supabase.from("audit_log").select("id,actor_user_id,table_name,row_id,action,created_at").order("created_at", { ascending: false }).limit(100), "Audit log").catch((): AuditRecord[] => []),
  ]);
  return { profile, products, priceEntries, publishedPrices, discounts, settings, locations, locationRevisions, warehouses, audit };
}
