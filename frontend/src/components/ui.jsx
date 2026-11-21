export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export function StatCard({ label, value, hint, tone = "default" }) {
  return (
    <div className={`card stat stat-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

export function Alert({ message, type = "error", onClose }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button className="alert-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      )}
    </div>
  );
}

export function StockBadge({ status }) {
  return status === "LOW_STOCK" ? (
    <span className="badge badge-warn">Low stock</span>
  ) : (
    <span className="badge badge-ok">OK</span>
  );
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>;
}
