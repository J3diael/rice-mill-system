import { useState } from "react";
import api, { errorMessage } from "../api.js";
import { useApi } from "../useApi.js";
import { formatDateTime, formatPeso } from "../format.js";
import { Alert, Empty, PageHeader } from "../components/ui.jsx";
import Receipt from "../components/Receipt.jsx";

export default function Sales() {
  const { data: sales, error, loading } = useApi("/sales?limit=200", []);
  const [receipt, setReceipt] = useState(null);
  const [openError, setOpenError] = useState("");

  const open = async (id) => {
    try {
      const res = await api.get(`/sales/${id}`);
      setReceipt(res.data);
    } catch (err) {
      setOpenError(errorMessage(err));
    }
  };

  const total = sales.reduce((sum, s) => sum + s.total, 0);

  return (
    <>
      <PageHeader title="Sales History" subtitle={`Latest ${sales.length} sales · ${formatPeso(total)}`} />
      <Alert message={error || openError} onClose={() => setOpenError("")} />

      <section className="card">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : sales.length === 0 ? (
          <Empty>No sales yet. Make your first one in Point of Sale.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Items</th>
                <th className="num">Total</th>
                <th>Cashier</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>{String(s.id).padStart(6, "0")}</td>
                  <td>{formatDateTime(s.created_at)}</td>
                  <td>{s.customer_name || <span className="muted">Walk-in</span>}</td>
                  <td>
                    <span className={`badge ${s.payment_method === "CREDIT" ? "badge-warn" : "badge-ok"}`}>
                      {s.payment_method}
                    </span>
                  </td>
                  <td>{s.item_count}</td>
                  <td className="num">{formatPeso(s.total)}</td>
                  <td>{s.cashier_name}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => open(s.id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}
    </>
  );
}
