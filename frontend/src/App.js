import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import Login from "./pages/Login";

// 1. Chart Registration
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// 2. API Configuration
const API_BASE_URL = "http://localhost:5000/api";
const api = axios.create({ baseURL: API_BASE_URL });

// Interceptor to attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function App() {
  // ======= STATE =======
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const [data, setData] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ material_id: "", type: "USE", quantity: "" });

  // ======= ACTIONS =======
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get("/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await api.get("/materials");
      setMaterials(res.data);
    } catch (err) {
      console.error("Materials fetch error:", err);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      fetchMaterials();
      fetchDashboard();
    }
  }, [loggedIn, fetchDashboard, fetchMaterials]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setData(null); // Clear data on logout
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/transactions", {
        material_id: Number(form.material_id),
        type: form.type,
        quantity: Number(form.quantity),
      });
      setMessage("Transaction successful!");
      setForm({ material_id: "", type: "USE", quantity: "" });
      // Refresh data
      fetchDashboard();
      fetchMaterials(); 
    } catch (err) {
      setMessage("Error processing transaction");
    }
  };

  // ======= RENDER LOGIC =======
  if (!loggedIn) return <Login setLoggedIn={setLoggedIn} />;
  if (loading || !data) return <div className="loader"><h2>Loading Rice Mill Data...</h2></div>;

  const chartData = {
    labels: data.recentTransactions.map((t) => t.material_name),
    datasets: [{
      label: "Quantity",
      data: data.recentTransactions.map((t) => t.quantity),
      backgroundColor: "#007bff",
    }],
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🏭 Rice Mill Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </header>

      {/* Stats Section */}
      <section style={styles.statsGrid}>
        <StatCard title="Total Materials" value={data.totalMaterials} color="#f3f3f3" />
        <StatCard title="Low Stock" value={data.lowStockItems} color="#ffe0e0" />
        <StatCard title="Transactions" value={data.totalTransactions} color="#e0f7ff" />
      </section>

      <div style={styles.mainContent}>
        {/* Left Side: Chart */}
        <div style={styles.chartCol}>
          <h2>📊 Recent Activity</h2>
          <Bar data={chartData} />
        </div>

        {/* Right Side: Form */}
        <div style={styles.formCol}>
          <h2>Process Transaction</h2>
          {message && <p style={{ color: message.includes("Error") ? "red" : "green" }}>{message}</p>}
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <select
              value={form.material_id}
              onChange={(e) => setForm({ ...form, material_id: e.target.value })}
              required
            >
              <option value="">Select Material</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.quantity}) {Number(m.quantity) <= Number(m.reorder_level) ? "⚠️" : ""}
                </option>
              ))}
            </select>

            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="USE">USE</option>
              <option value="ADD">ADD</option>
            </select>

            <input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />

            <button type="submit" style={styles.submitBtn}>Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Sub-component for cleaner JSX
const StatCard = ({ title, value, color }) => (
  <div style={{ ...styles.card, background: color }}>
    <h3>{title}</h3>
    <h2>{value}</h2>
  </div>
);

// Basic Styles Object to declutter the JSX
const styles = {
  container: { padding: "30px", fontFamily: "sans-serif", maxWidth: "1200px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statsGrid: { display: "flex", gap: "20px", marginBottom: "30px" },
  card: { padding: "20px", borderRadius: "10px", flex: 1, textAlign: "center" },
  mainContent: { display: "flex", gap: "40px" },
  chartCol: { flex: 2 },
  formCol: { flex: 1 },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  logoutBtn: { padding: "8px 16px", background: "#dc3545", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" },
  submitBtn: { padding: "10px", background: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }
};

export default App;