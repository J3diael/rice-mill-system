import { useState } from "react";
import api, { errorMessage } from "../api.js";
import { useApi } from "../useApi.js";
import { formatDateTime, formatNumber } from "../format.js";
import { Alert, Empty, PageHeader } from "../components/ui.jsx";

const blank = { material_id: "", input_qty: "", product_id: "", output_qty: "", notes: "" };

export default function Milling() {
  const materials = useApi("/materials", []);
  const products = useApi("/products", []);
  const batches = useApi("/milling", []);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState({ text: "", type: "success" });
  const [saving, setSaving] = useState(false);

  const material = materials.data.find((m) => String(m.id) === form.material_id);
  const product = products.data.find((p) => String(p.id) === form.product_id);

  // Live preview of recovery rate, same formula as the server
  let preview = null;
  if (material?.unit.toLowerCase() === "kg" && product?.weight_kg && form.input_qty > 0 && form.output_qty > 0) {
    preview = ((form.output_qty * product.weight_kg) / form.input_qty) * 100;
  }

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/milling", form);
      setMessage({ text: `Batch #${res.data.id} saved.`, type: "success" });
      setForm(blank);
      materials.reload();
      products.reload();
      batches.reload();
    } catch (err) {
      setMessage({ text: errorMessage(err), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const field = (name) => ({
    value: form[name],
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
  });

  return (
    <>
      <PageHeader title="Milling" subtitle="Record each milling run: raw material in, finished product out" />
      <Alert
        message={message.text || materials.error || products.error || batches.error}
        type={message.text ? message.type : "error"}
        onClose={() => setMessage({ text: "" })}
      />

      <div className="two-col">
        <form className="card form" onSubmit={submit}>
          <h2>New milling batch</h2>
          <label>
            Raw material used
            <select required {...field("material_id")}>
              <option value="">Select…</option>
              {materials.data.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({formatNumber(m.quantity)} {m.unit} available)
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity used {material && `(${material.unit})`}
            <input type="number" min="0" step="any" required {...field("input_qty")} />
          </label>
          <label>
            Product produced
            <select required {...field("product_id")}>
              <option value="">Select…</option>
              {products.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity produced {product && `(${product.unit})`}
            <input type="number" min="0" step="any" required {...field("output_qty")} />
          </label>
          <label>
            Notes
            <input placeholder="e.g. Operator, machine, palay variety" {...field("notes")} />
          </label>
          {preview !== null && (
            <p className={preview < 55 || preview > 75 ? "text-red" : "text-green"}>
              Recovery rate: {preview.toFixed(1)}% {preview < 55 || preview > 75 ? "(unusual, please double-check)" : ""}
            </p>
          )}
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save batch"}
          </button>
        </form>

        <section className="card">
          <h2>Recent batches</h2>
          {batches.data.length === 0 ? (
            <Empty>No milling batches recorded yet.</Empty>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Input</th>
                  <th>Output</th>
                  <th className="num">Recovery</th>
                </tr>
              </thead>
              <tbody>
                {batches.data.map((b) => (
                  <tr key={b.id}>
                    <td>
                      {formatDateTime(b.milled_at)}
                      {b.notes && <small className="muted block">{b.notes}</small>}
                    </td>
                    <td>
                      {formatNumber(b.input_qty)} {b.material_unit} {b.material_name}
                    </td>
                    <td>
                      {formatNumber(b.output_qty)} {b.product_unit} {b.product_name}
                    </td>
                    <td className="num">{b.recovery_rate !== null ? `${b.recovery_rate}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
