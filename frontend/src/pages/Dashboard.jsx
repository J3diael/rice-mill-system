import { Bar } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from "chart.js";
import { useApi } from "../useApi.js";
import { formatDateTime, formatNumber, formatPeso } from "../format.js";
import { Alert, Empty, PageHeader, StatCard } from "../components/ui.jsx";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const dayLabel = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });

export default function Dashboard() {
  const { data, error, loading } = useApi("/dashboard");

  if (loading) return <p className="muted">Loading dashboard…</p>;
  if (error) return <Alert message={error} />;

  const chart = {
    labels: data.sales_last_7_days.map((d) => dayLabel(d.day)),
    datasets: [
      {
        label: "Sales",
        data: data.sales_last_7_days.map((d) => d.total),
        backgroundColor: "#2f855a",
        borderRadius: 6,
      },
    ],
  };

  const milling = data.milling_this_month;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Today at a glance" />

      <section className="stats-grid">
        <StatCard
          label="Sales today"
          value={formatPeso(data.sales_today.total)}
          hint={`${data.sales_today.count} transaction(s)`}
          tone="green"
        />
        <StatCard
          label="Milling this month"
          value={`${milling.batches} batch(es)`}
          hint={
            milling.avg_recovery_rate
              ? `${formatNumber(milling.input_qty)} input · ${milling.avg_recovery_rate}% avg recovery`
              : `${formatNumber(milling.input_qty)} input`
          }
        />
        <StatCard
          label="Low stock items"
          value={data.low_stock_materials + data.low_stock_products}
          hint={`${data.low_stock_materials} material(s), ${data.low_stock_products} product(s)`}
          tone={data.low_stock.length ? "warn" : "default"}
        />
        <StatCard label="Products" value={data.total_products} hint={`${data.total_materials} raw materials`} />
      </section>

      <div className="two-col">
        <section className="card">
          <h2>Sales, last 7 days</h2>
          <Bar
            data={chart}
            options={{
              plugins: { tooltip: { callbacks: { label: (ctx) => formatPeso(ctx.parsed.y) } } },
              scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatPeso(v) } } },
            }}
          />
        </section>

        <section className="card">
          <h2>Needs restocking</h2>
          {data.low_stock.length === 0 ? (
            <Empty>Everything is above its reorder level. 👍</Empty>
          ) : (
            <ul className="list">
              {data.low_stock.map((item) => (
                <li key={`${item.kind}-${item.name}`}>
                  <span>
                    {item.name}
                    <small className="muted"> ({item.kind})</small>
                  </span>
                  <span className="badge badge-warn">
                    {formatNumber(item.stock)} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt">Recent stock movements</h2>
          {data.recent_transactions.length === 0 ? (
            <Empty>No stock movements yet.</Empty>
          ) : (
            <ul className="list">
              {data.recent_transactions.map((t) => (
                <li key={t.id}>
                  <span>
                    {t.material_name}
                    <small className="muted"> · {formatDateTime(t.created_at)}</small>
                  </span>
                  <span className={t.type === "ADD" ? "text-green" : "text-red"}>
                    {t.type === "ADD" ? "+" : "−"}
                    {formatNumber(t.quantity)} {t.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
