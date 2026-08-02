import { getSupabase } from "@/lib/supabase";
import type { AuditRecord, CatalogDeploymentState, CatalogFamily, CatalogProduct, DiscountCampaign, Order, OrderItem, PriceEntry, ProductStockStatus, PublishedPrice, ServiceLocation, SiteSetting, StaffProfile, StockNotifyRequest, Warehouse } from "@/lib/types";

export type ControlPanelSnapshot = {
  profile: StaffProfile;
  products: CatalogProduct[];
  catalogFamilies: CatalogFamily[];
  catalogDeploymentState: CatalogDeploymentState;
  priceEntries: PriceEntry[];
  publishedPrices: PublishedPrice[];
  discounts: DiscountCampaign[];
  settings: SiteSetting[];
  locations: ServiceLocation[];
  warehouses: Warehouse[];
  audit: AuditRecord[];
  stockStatuses: ProductStockStatus[];
  notifyRequests: StockNotifyRequest[];
  orders: Order[];
  orderItems: OrderItem[];
};

async function requireData<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>, label: string): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  if (data === null) throw new Error(`${label}: no data returned`);
  return data;
}

export async function loadSnapshot(userId: string): Promise<ControlPanelSnapshot> {
  const supabase = getSupabase();
  const [profile, products, catalogFamilies, catalogDeploymentState, priceEntries, publishedPrices, discounts, settings, locations, warehouses, audit, stockStatuses, notifyRequests, orders, orderItems] = await Promise.all([
    requireData<StaffProfile>(supabase.from("staff_profiles").select("user_id,full_name,role,active").eq("user_id", userId).single(), "Profile"),
    requireData<CatalogProduct[]>(supabase.from("catalog_products").select("*").order("brand").order("family_name_en").order("capacity_hp"), "Products"),
    requireData<CatalogFamily[]>(supabase.from("catalog_families").select("*").order("brand").order("display_order"), "Catalog families"),
    requireData<CatalogDeploymentState>(supabase.from("catalog_storefront_deployment_state").select("*").eq("singleton", true).single(), "Catalog deployment state"),
    requireData<PriceEntry[]>(supabase.from("product_price_entries").select("*").order("updated_at", { ascending: false }), "Price entries"),
    requireData<PublishedPrice[]>(supabase.from("published_product_prices").select("*").order("model_code"), "Published prices"),
    requireData<DiscountCampaign[]>(supabase.from("discount_campaigns").select("*").order("starts_at", { ascending: false }), "Discounts"),
    requireData<SiteSetting[]>(supabase.from("site_settings").select("*").order("category").order("key"), "Settings"),
    requireData<ServiceLocation[]>(supabase.from("service_locations").select("*").order("display_order"), "Locations"),
    requireData<Warehouse[]>(supabase.from("warehouses").select("*").order("code"), "Warehouses"),
    requireData<AuditRecord[]>(supabase.from("audit_log").select("id,actor_user_id,table_name,row_id,action,created_at").order("created_at", { ascending: false }).limit(100), "Audit log").catch((): AuditRecord[] => []),
    requireData<ProductStockStatus[]>(supabase.from("product_stock_status").select("*"), "Stock status").catch((): ProductStockStatus[] => []),
    requireData<StockNotifyRequest[]>(supabase.from("stock_notify_requests").select("*").order("created_at", { ascending: false }), "Notify requests").catch((): StockNotifyRequest[] => []),
    requireData<Order[]>(supabase.from("orders").select("*").order("created_at", { ascending: false }), "Orders").catch((): Order[] => []),
    requireData<OrderItem[]>(supabase.from("order_items").select("*"), "Order items").catch((): OrderItem[] => []),
  ]);
  return { profile, products, catalogFamilies, catalogDeploymentState, priceEntries, publishedPrices, discounts, settings, locations, warehouses, audit, stockStatuses, notifyRequests, orders, orderItems };
}
