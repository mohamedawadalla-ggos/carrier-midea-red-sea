"use client";

import { useState, type FormEvent } from "react";
import { can } from "@/lib/access";
import type { ControlPanelSnapshot } from "@/lib/data";
import type { CatalogFamily, CatalogProduct, RecordStatus } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

const statuses: RecordStatus[] = ["draft", "pending_approval", "published", "archived"];
const productTypes = ["wall-mounted-split", "concealed-ducted", "ceiling-cassette", "floor-standing"] as const;

function checkedValues(form: FormData, name: string): string[] {
  return form.getAll(name).map(String);
}

export function CatalogManagementPanel({ data, refresh }: { data: ControlPanelSnapshot; refresh: () => Promise<void> }) {
  const [familyId, setFamilyId] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [message, setMessage] = useState("");
  const editable = can(data.profile.role, "editCatalogProducts");
  const family = data.catalogFamilies.find((item) => item.id === familyId);
  const product = data.products.find((item) => item.model_code === modelCode);

  if (!editable) return <div className="panel-stack"><header className="page-heading"><div><p className="eyebrow">CATALOG MASTER DATA</p><h2>Catalog management</h2></div></header><p className="error">Your role cannot change catalog master data.</p></div>;

  async function saveFamily(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = family?.id ?? String(form.get("id")).trim().toLowerCase();
    const status = String(form.get("status")) as RecordStatus;
    if (status === "published" && !window.confirm("Publishing master data still requires a manual storefront rebuild. Continue?")) return;
    const payload = {
      slug: String(form.get("slug")).trim().toLowerCase(), brand: String(form.get("brand")),
      name_en: String(form.get("nameEn")).trim(), name_ar: String(form.get("nameAr")).trim(),
      product_type: String(form.get("productType")), market_segments: checkedValues(form, "marketSegments"),
      technology: String(form.get("technology")), refrigerant: String(form.get("refrigerant")),
      description_en: String(form.get("descriptionEn")).trim(), description_ar: String(form.get("descriptionAr")).trim(),
      highlights_en: String(form.get("highlightsEn")).split("\n").map((value) => value.trim()).filter(Boolean),
      highlights_ar: String(form.get("highlightsAr")).split("\n").map((value) => value.trim()).filter(Boolean),
      family_image_path: String(form.get("imagePath")).trim() || null,
      asset_authorization: String(form.get("assetAuthorization")), featured: form.get("featured") === "on",
      display_order: Number(form.get("displayOrder")), visible: status === "published" && form.get("visible") === "on",
      status, source_reference: String(form.get("sourceReference")).trim(),
    };
    const query = family ? getSupabase().from("catalog_families").update(payload).eq("id", family.id) : getSupabase().from("catalog_families").insert({ id, ...payload, visible: false, status: "draft" });
    const { error } = await query;
    if (error) setMessage(error.message); else { setMessage(family ? "Family updated." : "Family draft created."); setFamilyId(id); await refresh(); }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const selectedFamily = data.catalogFamilies.find((item) => item.id === String(form.get("familyId")));
    if (!selectedFamily) { setMessage("Select a valid family."); return; }
    const status = String(form.get("status")) as RecordStatus;
    if (status === "published" && !window.confirm("Publishing master data still requires a manual storefront rebuild. Continue?")) return;
    const payload = {
      family_id: selectedFamily.id, family_name_en: selectedFamily.name_en, family_name_ar: selectedFamily.name_ar,
      brand: selectedFamily.brand, capacity_hp: Number(form.get("capacityHp")),
      capacity_btu: form.get("capacityBtu") ? Number(form.get("capacityBtu")) : null,
      cooling_mode: String(form.get("coolingMode")), refrigerant: selectedFamily.refrigerant,
      energy_class: String(form.get("energyClass")).trim() || null, display_order: Number(form.get("displayOrder")),
      active: form.get("active") === "on", requires_inspection: form.get("requiresInspection") === "on",
      visible: status === "published" && form.get("visible") === "on", catalog_status: status,
      source_reference: String(form.get("sourceReference")).trim(),
    };
    const nextCode = product?.model_code ?? String(form.get("modelCode")).trim().toUpperCase();
    const query = product ? getSupabase().from("catalog_products").update(payload).eq("model_code", product.model_code) : getSupabase().from("catalog_products").insert({ model_code: nextCode, ...payload, visible: false, catalog_status: "draft" });
    const { error } = await query;
    if (error) setMessage(error.message); else { setMessage(product ? "Product updated." : "Product draft created."); setModelCode(nextCode); await refresh(); }
  }

  return <div className="panel-stack">
    <header className="page-heading"><div><p className="eyebrow">CATALOG MASTER DATA</p><h2>Families and products</h2><p>Create drafts, edit approved fields, then publish into the next manual storefront build.</p></div><span className="status-pill">Management only</span></header>
    <p className="notice">No permanent delete is available. Archive or hide records so historic orders, prices and audit entries remain intact.</p>
    {message && <p className={message.endsWith(".") ? "success" : "error"}>{message}</p>}
    <div className="catalog-management-grid">
      <article className="card"><div className="editor-heading"><h3>Family editor</h3><select aria-label="Choose family to edit" value={familyId} onChange={(event) => setFamilyId(event.target.value)}><option value="">Create new family</option>{data.catalogFamilies.map((item) => <option key={item.id} value={item.id}>{item.brand} · {item.name_en}</option>)}</select></div><FamilyForm key={family?.id ?? "new-family"} family={family} onSubmit={saveFamily} /></article>
      <article className="card"><div className="editor-heading"><h3>Product editor</h3><select aria-label="Choose product to edit" value={modelCode} onChange={(event) => setModelCode(event.target.value)}><option value="">Create new product</option>{data.products.map((item) => <option key={item.model_code} value={item.model_code}>{item.model_code} · {item.family_name_en}</option>)}</select></div><ProductForm key={product?.model_code ?? "new-product"} product={product} families={data.catalogFamilies} onSubmit={saveProduct} /></article>
    </div>
  </div>;
}

function FamilyForm({ family, onSubmit }: { family?: CatalogFamily; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="form-grid" onSubmit={onSubmit}>
    <label>ID<input name="id" defaultValue={family?.id} disabled={Boolean(family)} pattern="[a-z0-9-]+" required /></label><label>Slug<input name="slug" defaultValue={family?.slug} pattern="[a-z0-9-]+" required /></label>
    <label>Brand<select name="brand" defaultValue={family?.brand ?? "carrier"}><option value="carrier">Carrier</option><option value="midea">Midea</option></select></label>
    <label>English name<input name="nameEn" defaultValue={family?.name_en} required /></label><label>Arabic name<input name="nameAr" defaultValue={family?.name_ar} dir="rtl" required /></label>
    <label>System category<select name="productType" defaultValue={family?.product_type ?? productTypes[0]}>{productTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
    <fieldset><legend>Market segments</legend>{(["residential", "commercial", "projects"] as const).map((value) => <label className="check-row" key={value}><input type="checkbox" name="marketSegments" value={value} defaultChecked={family?.market_segments.includes(value) ?? value === "residential"} />{value}</label>)}</fieldset>
    <label>Technology<select name="technology" defaultValue={family?.technology ?? "fixed-speed"}><option value="inverter">Inverter</option><option value="fixed-speed">Fixed speed</option></select></label><label>Refrigerant<select name="refrigerant" defaultValue={family?.refrigerant ?? "R410A"}><option>R32</option><option>R410A</option></select></label>
    <label className="wide">English description<textarea name="descriptionEn" defaultValue={family?.description_en} /></label><label className="wide">Arabic description<textarea name="descriptionAr" defaultValue={family?.description_ar} dir="rtl" /></label>
    <label className="wide">English highlights (one per line)<textarea name="highlightsEn" defaultValue={family?.highlights_en.join("\n")} /></label><label className="wide">Arabic highlights (one per line)<textarea name="highlightsAr" defaultValue={family?.highlights_ar.join("\n")} dir="rtl" /></label>
    <label>Image path<input name="imagePath" defaultValue={family?.family_image_path ?? ""} placeholder="/products/catalog/..." /></label><label>Asset authorization<select name="assetAuthorization" defaultValue={family?.asset_authorization ?? "pending"}><option value="pending">Pending</option><option value="approved">Approved</option></select></label>
    <label>Display order<input type="number" min="0" name="displayOrder" defaultValue={family?.display_order ?? 0} required /></label><label>Status<select name="status" defaultValue={family?.status ?? "draft"}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
    <label className="check-row"><input type="checkbox" name="featured" defaultChecked={family?.featured} /> Featured</label><label className="check-row"><input type="checkbox" name="visible" defaultChecked={family?.visible} /> Visible after deployment</label>
    <label className="wide">Source reference<input name="sourceReference" defaultValue={family?.source_reference ?? "Client-approved catalog update"} required /></label><button className="primary wide">{family ? "Save family changes" : "Create family draft"}</button>
  </form>;
}

function ProductForm({ product, families, onSubmit }: { product?: CatalogProduct; families: CatalogFamily[]; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="form-grid" onSubmit={onSubmit}>
    <label>Model code<input name="modelCode" defaultValue={product?.model_code} disabled={Boolean(product)} required /></label><label>Family<select name="familyId" defaultValue={product?.family_id ?? families[0]?.id} required>{families.map((family) => <option key={family.id} value={family.id}>{family.brand} · {family.name_en}</option>)}</select></label>
    <label>Capacity HP<input type="number" min="0.1" step="0.01" name="capacityHp" defaultValue={product?.capacity_hp ?? 1.5} required /></label><label>Capacity BTU<input type="number" min="1" name="capacityBtu" defaultValue={product?.capacity_btu ?? ""} /></label>
    <label>Cooling mode<select name="coolingMode" defaultValue={product?.cooling_mode ?? "cool-only"}><option value="cool-only">Cool only</option><option value="heat-pump">Cool & heat</option></select></label><label>Energy class<input name="energyClass" defaultValue={product?.energy_class ?? ""} /></label>
    <label>Display order<input type="number" min="0" name="displayOrder" defaultValue={product?.display_order ?? 0} required /></label><label>Status<select name="status" defaultValue={product?.catalog_status ?? "draft"}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
    <label className="check-row"><input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Operationally active</label><label className="check-row"><input type="checkbox" name="requiresInspection" defaultChecked={product?.requires_inspection} /> Requires inspection</label><label className="check-row"><input type="checkbox" name="visible" defaultChecked={product?.visible} /> Visible after deployment</label>
    <label className="wide">Source reference<input name="sourceReference" defaultValue={product?.source_reference ?? "Client-approved catalog update"} required /></label><button className="primary wide">{product ? "Save product changes" : "Create product draft"}</button>
  </form>;
}
