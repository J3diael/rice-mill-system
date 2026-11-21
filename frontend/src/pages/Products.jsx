import { useState } from "react";
import api, { errorMessage } from "../api.js";
import { useApi } from "../useApi.js";
import { formatNumber, formatPeso } from "../format.js";
import { Alert, Empty, PageHeader, StockBadge } from "../components/ui.jsx";

const blank = { id: null, name: "", unit: "sack", weight_kg: "", price: "", stock: "", reorder_level: "" };

export default function Products({ user }) {
  const products = useApi("/products", []);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState({ text: "", type: "success" });
  const isAdmin = user.role === "admin";

  const save = async (e) => {
    e.preventDefault();
    const body = { ...form, stock: form.stock || 0, reorder_level: form.reorder_level || 0 };
    try {
      if (form.id) await api.put(`/products/${form.id}`, body);
      else await api.post("/products", body);
      setMessage({ text: `${form.name} saved.`, type: "success" });
      setForm(blank);
      products.reload();
    } catch (err) {
      setMessage({ text: errorMessage(err), type: "error" });
    }
  };

  const edit = (p) =>
    setForm({ ...p, weight_kg: p.weight_kg ?? "", stock: p.stock, reorder_level: p.reorder_level });

  const field = (name) => ({
    value: form[name],
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
  });

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Finished goods for sale. Stock goes up through Milling and down through Sales."
      />
      <Alert
        message={message.text || products.error}
        type={message.text ? message.type : "error"}
        onClose={() => setMessage({ text: "" })}
      />

      <div className={isAdmin ? "two-col" : ""}>
        <section className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="num">Price</th>
                <th className="num">In stock</th>
                <th>Status</th>
                {isAdmin && <th />}
              </tr>
            </thead>
            <tbody>
              {products.data.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.name}
                    {p.weight_kg && <small className="muted block">{formatNumber(p.weight_kg)} kg per {p.unit}</small>}
                  </td>
                  <td className="num">
                    {formatPeso(p.price)} / {p.unit}
                  </td>
                  <td className="num">
                    {formatNumber(p.stock)} {p.unit}
                  </td>
                  <td>
                    <StockBadge status={p.stock_status} />
                  </td>
                  {isAdmin && (
                    <td>
                      <button className="btn btn-sm" onClick={() => edit(p)}>
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {products.data.length === 0 && !products.loading && <Empty>No products yet.</Empty>}
        </section>

        {isAdmin && (
          <form className="card form" onSubmit={save}>
            <h2>{form.id ? `Edit ${form.name}` : "Add a product"}</h2>
            <label>
              Name
              <input required {...field("name")} />
            </label>
            <div className="row">
              <label>
                Unit
                <input required {...field("unit")} />
              </label>
              <label>
                Weight per unit (kg)
                <input type="number" min="0" step="any" placeholder="Optional" {...field("weight_kg")} />
              </label>
            </div>
            <div className="row">
              <label>
                Price (₱)
                <input type="number" min="0" step="any" required {...field("price")} />
              </label>
              <label>
                Reorder at
                <input type="number" min="0" step="any" {...field("reorder_level")} />
              </label>
            </div>
            {!form.id && (
              <label>
                Starting stock
                <input type="number" min="0" step="any" {...field("stock")} />
              </label>
            )}
            <div className="row">
              <button className="btn btn-primary">{form.id ? "Save changes" : "Add product"}</button>
              {form.id && (
                <button type="button" className="btn btn-ghost" onClick={() => setForm(blank)}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </>
  );
}
