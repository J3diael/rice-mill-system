import { formatDateTime, formatNumber, formatPeso } from "../format.js";

export default function Receipt({ sale, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt" id="receipt">
          <h2>🏭 Rice Mill</h2>
          <p className="muted">Official Receipt #{String(sale.id).padStart(6, "0")}</p>
          <p className="muted">{formatDateTime(sale.created_at)}</p>
          {sale.customer_name && <p>Customer: {sale.customer_name}</p>}
          <table>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.product_name}
                    <br />
                    <small>
                      {formatNumber(item.quantity)} {item.unit} × {formatPeso(item.unit_price)}
                    </small>
                  </td>
                  <td className="num">{formatPeso(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <th className="num">{formatPeso(sale.total)}</th>
              </tr>
              <tr>
                <td>Paid ({sale.payment_method})</td>
                <td className="num">{formatPeso(sale.amount_paid)}</td>
              </tr>
              {sale.payment_method === "CREDIT" ? (
                <tr>
                  <td>Balance due</td>
                  <td className="num">{formatPeso(sale.balance)}</td>
                </tr>
              ) : (
                <tr>
                  <td>Change</td>
                  <td className="num">{formatPeso(sale.change)}</td>
                </tr>
              )}
            </tfoot>
          </table>
          {sale.cashier_name && <p className="muted">Cashier: {sale.cashier_name}</p>}
          <p className="muted">Salamat po!</p>
        </div>
        <div className="modal-actions no-print">
          <button className="btn" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            Print receipt
          </button>
        </div>
      </div>
    </div>
  );
}
