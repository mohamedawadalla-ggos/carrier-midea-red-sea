export type AppRole = "super_admin" | "management" | "accounts" | "sales" | "operations" | "marketing" | "auditor";
export type RecordStatus = "draft" | "pending_approval" | "approved" | "published" | "rejected" | "archived";

export type StaffProfile = {
  user_id: string;
  full_name: string;
  role: AppRole;
  active: boolean;
};

export type CatalogProduct = {
  model_code: string;
  family_id: string;
  family_name_ar: string;
  family_name_en: string;
  brand: "carrier" | "midea";
  capacity_hp: number;
  cooling_mode: "cool-only" | "heat-pump";
  refrigerant: string;
  active: boolean;
};

export type PriceEntry = {
  id: string;
  model_code: string;
  currency: string;
  end_user_price_minor: number;
  dealer_cost_minor: number;
  minimum_price_minor: number | null;
  tax_included: boolean;
  effective_from: string;
  expires_at: string | null;
  source_reference: string;
  status: RecordStatus;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PublishedPrice = {
  model_code: string;
  currency: string;
  list_price_minor: number;
  sale_price_minor: number;
  discount_label_ar: string | null;
  discount_label_en: string | null;
  effective_from: string;
  expires_at: string | null;
  published: boolean;
  published_at: string;
};

export type DiscountCampaign = {
  id: string;
  code: string;
  title_ar: string;
  title_en: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value_minor_or_bps: number;
  starts_at: string;
  ends_at: string;
  status: RecordStatus;
  approval_reference: string | null;
};

export type SiteSetting = {
  key: string;
  category: string;
  label_ar: string;
  label_en: string;
  value_json: unknown;
  value_type: "text" | "url" | "phone" | "boolean" | "number" | "json";
  is_public: boolean;
  status: RecordStatus;
  updated_at: string;
};

export type ServiceLocation = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  governorate_ar: string;
  governorate_en: string;
  active: boolean;
  sales_available: boolean;
  delivery_available: boolean;
  installation_available: boolean;
  maintenance_available: boolean;
  mobilization_required: boolean;
  requires_inspection: boolean;
  display_order: number;
  status: RecordStatus;
};

export type Warehouse = {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  city_id: string | null;
  active: boolean;
};

export type AuditRecord = {
  id: number;
  actor_user_id: string | null;
  table_name: string;
  row_id: string | null;
  action: string;
  created_at: string;
};
