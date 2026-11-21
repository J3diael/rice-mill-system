import { useEffect, useState } from "react";
import { session } from "./api.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import Milling from "./pages/Milling.jsx";
import POS from "./pages/POS.jsx";
import Sales from "./pages/Sales.jsx";
import Products from "./pages/Products.jsx";
import Users from "./pages/Users.jsx";

const PAGES = [
  { id: "dashboard", label: "Dashboard", icon: "📊", component: Dashboard },
  { id: "pos", label: "Point of Sale", icon: "🧾", component: POS },
  { id: "sales", label: "Sales History", icon: "📈", component: Sales },
  { id: "milling", label: "Milling", icon: "⚙️", component: Milling },
  { id: "inventory", label: "Raw Materials", icon: "🌾", component: Inventory },
  { id: "products", label: "Products", icon: "📦", component: Products },
  { id: "users", label: "Users", icon: "👥", component: Users, adminOnly: true },
];

export default function App() {
  const [user, setUser] = useState(session.token ? session.user : null);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("ricemill:logout", onLogout);
    return () => window.removeEventListener("ricemill:logout", onLogout);
  }, []);

  const logout = () => {
    session.clear();
    setUser(null);
    setPage("dashboard");
  };

  if (!user) return <Login onLogin={setUser} />;

  const visiblePages = PAGES.filter((p) => !p.adminOnly || user.role === "admin");
  const Current = (visiblePages.find((p) => p.id === page) || visiblePages[0]).component;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">🏭 Rice Mill</div>
        <nav>
          {visiblePages.map((p) => (
            <button
              key={p.id}
              className={`nav-item ${p.id === page ? "active" : ""}`}
              onClick={() => setPage(p.id)}
            >
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="who">
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
          <button className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="content">
        <Current user={user} />
      </main>
    </div>
  );
}
