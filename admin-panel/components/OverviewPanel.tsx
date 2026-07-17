import type { ControlPanelSnapshot } from "@/lib/data";
import { formatMoney } from "@/lib/money";

export function OverviewPanel({ data }: { data: ControlPanelSnapshot }) {
  const published = data.publishedPrices.filter((price) => price.published).length;
  const activeOffers = data.discounts.filter((item) => item.status === "published").length;
  const activeCities = data.locations.filter((city) => city.active && city.status === "published").length;
  const lastPrice = data.publishedPrices[0];
  return <div className="panel-stack">
    <header className="page-heading"><div><p className="eyebrow">OVERVIEW</p><h2>Business control center</h2></div><span className="status-pill">Live access: {data.profile.role.replaceAll("_", " ")}</span></header>
    <section className="metric-grid">
      <article><span>Catalog models</span><strong>{data.products.length}</strong><small>61 expected</small></article>
      <article><span>Published prices</span><strong>{published}</strong><small>{data.priceEntries.length} price-book records</small></article>
      <article><span>Active offers</span><strong>{activeOffers}</strong><small>{data.discounts.length} campaigns total</small></article>
      <article><span>Service cities</span><strong>{activeCities}</strong><small>{data.locations.length} configured</small></article>
    </section>
    <section className="dashboard-grid">
      <article className="card"><h3>Publishing checklist</h3><ul className="check-list"><li>End-user prices only on the public storefront</li><li>Dealer costs restricted to Accounts and Management</li><li>Expired discounts automatically hidden by public view</li><li>48K/60K products remain quotation-only until Miraco clarification</li></ul></article>
      <article className="card"><h3>Latest public price</h3>{lastPrice ? <><strong className="large-value">{formatMoney(lastPrice.sale_price_minor, lastPrice.currency)}</strong><p>{lastPrice.model_code}</p></> : <p className="empty">No prices published yet.</p>}</article>
    </section>
  </div>;
}
