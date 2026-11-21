import { useState } from "react";
import api, { errorMessage } from "../api.js";
import { useApi } from "../useApi.js";
import { formatDateTime, formatNumber } from "../format.js";
import { Alert, Empty, PageHeader, StockBadge } from "../components/ui.jsx";

const blankMove = { material_id: "", type: "ADD", quantity: "", note: "" };
const blankMaterial = { name: "", unit: "kg", quantity: "", reorder_level: "" };

export default function Inventory({ user }) {
  const materials = useApi("/materials", []);
  const transactions = useApi("/transactions?limit=100", []);
  const [move, setMove] = useState(blankMove);
  const [newMaterial, setNewMaterial] = useState(blankMaterial);
  const [message, setMessage] = useState({ text: "", type: "success" });

  const refresh = () => {
    materials.reload();
    transactions.reload();
  };

  const run = async (request, success, resetForm) => {
    try {
      await request();
      setMessage({ text: success, type: "success" });
      resetForm();
      refresh();
    } catch (err) {
      setMessage({ text: errorMessage(err), type: "error" });
    }
  };

  const recordMove = (e) => {
    e.preventDefault();
    run(() => api.post("/transactions", move), "Stock updated.", () => setMove(blankMove));
  };

  const addMaterial = (e) => {
    e.preventDefault();
    run(
      () => api.post("/materials", { ...newMaterial, quantity: newMaterial.quantity || 0, reorder_level: newMaterial.reorder_level || 0 }),
      `${newMaterial.name} added.`,
      () => setNewMaterial(blankMaterial)
    );
  };

  return (
    <>
      <PageHeader title="Raw Materials" subtitle="Palay, sacks, fuel and other supplies" />
      <Alert
        message={message.text || materials.error || transactions.error}
        type={message.text ? message.type : "error"}
        onClose={() => setMessage({ text: "" })}
      />

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Material</th>
              <th className="num">In stock</th>
              <th className="num">Reorder at</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {materials.data.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td className="num">
                  {formatNumber(m.quantity)} {m.unit}
                </td>
                <td className="num">
                  {formatNumber(m.reorder_level)} {m.unit}
                </td>
                <td>
                  <StockBadge status={m.stock_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {materials.data.length === 0 && !materials.loading && <Empty>No materials yet.</Empty>}
      </section>

      <div className="two-col">
        <form className="card form" onSubmit={recordMove}>
          <h2>Stock in / stock out</h2>
          <label>
            Material
            <select
              required
              value={move.material_id}
              onChange={(e) => setMove({ ...move, material_id: e.target.value })}
            >
              <option value="">Select…</option>
              {materials.data.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({formatNumber(m.quantity)} {m.unit})
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={move.type} onChange={(e) => setMove({ ...move, type: e.target.value })}>
              <option value="ADD">Stock in (delivery / purchase)</option>
              <option value="USE">Stock out (used / spoiled)</option>
            </select>
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="0"
              step="any"
              required
              value={move.quantity}
              onChange={(e) => setMove({ ...move, quantity: e.target.value })}
            />
          </label>
          <label>
            Note
            <input
              placeholder="e.g. Delivery from supplier, DR #123"
              value={move.note}
              onChange={(e) => setMove({ ...move, note: e.target.value })}
            />
          </label>
          <button className="btn btn-primary">Save</button>
        </form>

        {user.role === "admin" && (
          <form className="card form" onSubmit={addMaterial}>
            <h2>Add a new material</h2>
            <label>
              Name
              <input
                required
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
              />
            </label>
            <div className="row">
              <label>
                Unit
                <input
                  required
                  value={newMaterial.unit}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                />
              </label>
              <label>
                Starting stock
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                />
              </label>
              <label>
                Reorder at
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newMaterial.reorder_level}
                  onChange={(e) => setNewMaterial({ ...newMaterial, reorder_level: e.target.value })}
                />
              </label>
            </div>
            <button className="btn">Add material</button>
          </form>
        )}
      </div>

      <section className="card">
        <h2>Stock movement history</h2>
        {transactions.data.length === 0 ? (
          <Empty>No movements yet.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Material</th>
                <th className="num">Change</th>
                <th>Note</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {transactions.data.map((t) => (
                <tr key={t.id}>
                  <td>{formatDateTime(t.created_at)}</td>
                  <td>{t.material_name}</td>
                  <td className={`num ${t.type === "ADD" ? "text-green" : "text-red"}`}>
                    {t.type === "ADD" ? "+" : "−"}
                    {formatNumber(t.quantity)} {t.unit}
                  </td>
                  <td>{t.note}</td>
                  <td>{t.user_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
