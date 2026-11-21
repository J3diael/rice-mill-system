import { useMemo, useState } from "react";
import api, { errorMessage } from "../api.js";
import { useApi } from "../useApi.js";
import { formatNumber, formatPeso } from "../format.js";
import { Alert, Empty, PageHeader } from "../components/ui.jsx";
import Receipt from "../components/Receipt.jsx";

export default function POS() {
  const { data: products, error: loadError, reload } = useApi("/products", []);
  const [cart, setCart] = useState({}); // productId -> quantity
  const [customer, setCustomer] = useState("");
  const [method, setMethod] = useState("CASH");
  const [paid, setPaid] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const lines = Object.entries(cart)
    .filter(([id]) => byId[id])
    .map(([id, qty]) => ({ product: byId[id], qty }));
  const total = lines.reduce((sum, l) => sum + l.qty * l.product.price, 0);
  const paidNumber = paid === "" ? (method === "CREDIT" ? 0 : total) : Number(paid);
  const change = paidNumber - total;

  const visible = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const setQty = (id, qty) => {
    const max = byId[id]?.stock ?? 0;
    const clean = Math.max(0, Math.min(Number(qty) || 0, max));
    setCart((c) => {
      const next = { ...c };
      if (clean === 0) delete next[id];
      else next[id] = clean;
      return next;
    });
  };

  const addToCart = (product) => setQty(product.id, (cart[product.id] || 0) + 1);

  const reset = () => {
    setCart({});
    setCustomer("");
    setPaid("");
    setMethod("CASH");
  };

  const checkout = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await api.post("/sales", {
        customer_name: customer,
        payment_method: method,
        amount_paid: paid === "" ? undefined : Number(paid),
        items: lines.map((l) => ({ product_id: l.product.id, quantity: l.qty })),
      });
      setReceipt(res.data);
      reset();
      reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Point of Sale" subtitle="Tap a product to add it to the order" />
      <Alert message={loadError || error} onClose={() => setError("")} />

      <div className="pos">
        <section>
          <input
            className="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="product-grid">
            {visible.map((p) => (
              <button
                key={p.id}
                className="card product-tile"
                disabled={p.stock <= (cart[p.id] || 0)}
                onClick={() => addToCart(p)}
              >
                <strong>{p.name}</strong>
                <span className="price">{formatPeso(p.price)}</span>
                <small className={p.stock_status === "LOW_STOCK" ? "text-red" : "muted"}>
                  {formatNumber(p.stock)} {p.unit} left
                </small>
              </button>
            ))}
            {visible.length === 0 && <Empty>No products found.</Empty>}
          </div>
        </section>

        <aside className="card cart">
          <h2>Current order</h2>
          {lines.length === 0 ? (
            <Empty>No items yet.</Empty>
          ) : (
            <ul className="cart-lines">
              {lines.map(({ product, qty }) => (
                <li key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <small className="muted">{formatPeso(product.price)} / {product.unit}</small>
                  </div>
                  <div className="qty">
                    <button className="btn btn-sm" onClick={() => setQty(product.id, qty - 1)}>
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={qty}
                      onChange={(e) => setQty(product.id, e.target.value)}
                    />
                    <button className="btn btn-sm" onClick={() => setQty(product.id, qty + 1)}>
                      +
                    </button>
                  </div>
                  <span className="num">{formatPeso(qty * product.price)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="total-row">
            <span>Total</span>
            <strong>{formatPeso(total)}</strong>
          </div>

          <label>
            Customer (optional)
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </label>
          <label>
            Payment
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="CASH">Cash</option>
              <option value="GCASH">GCash</option>
              <option value="CREDIT">Credit (utang)</option>
            </select>
          </label>
          <label>
            {method === "CREDIT" ? "Down payment" : "Amount received"}
            <input
              type="number"
              min="0"
              step="any"
              placeholder={method === "CREDIT" ? "0" : formatNumber(total)}
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
            />
          </label>
          {lines.length > 0 && method !== "CREDIT" && (
            <p className={change < 0 ? "text-red" : "muted"}>
              {change < 0 ? `Short by ${formatPeso(-change)}` : `Change: ${formatPeso(change)}`}
            </p>
          )}
          {lines.length > 0 && method === "CREDIT" && (
            <p className="muted">Balance due: {formatPeso(Math.max(total - paidNumber, 0))}</p>
          )}

          <button
            className="btn btn-primary btn-block"
            disabled={lines.length === 0 || saving || (method !== "CREDIT" && change < 0)}
            onClick={checkout}
          >
            {saving ? "Saving…" : `Complete sale · ${formatPeso(total)}`}
          </button>
          {lines.length > 0 && (
            <button className="btn btn-ghost btn-block" onClick={reset}>
              Clear order
            </button>
          )}
        </aside>
      </div>

      {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}
    </>
  );
}
