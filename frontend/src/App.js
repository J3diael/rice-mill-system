import { useEffect, useState } from "react";
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
import Login from "./pages/Login"; // Make sure Login.js exists in src/

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function App() {
  // ======= ALL HOOKS AT THE TOP =======
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const [data, setData] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ material_id: "", type: "USE", quantity: "" });
  
  const handleLogout = () => {
  localStorage.removeItem("token"); // remove the saved token
  setLoggedIn(false); // trigger re-render to show login screen
};
  // ======= FETCH DASHBOARD =======
  const fetchDashboard = () => {
    axios
      .get("http://localhost:5000/api/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  };

  // ======= FETCH MATERIALS ON MOUNT =======
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/materials")
      .then((res) => setMaterials(res.data))
      .catch((err) => console.error(err));
    fetchDashboard();
  }, []);

  // ======= HANDLE TRANSACTION FORM SUBMIT =======
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/transactions", {
        material_id: Number(form.material_id),
        type: form.type,
        quantity: Number(form.quantity),
      });
      setMessage("Transaction successful!");
      fetchDashboard();
      setForm({ material_id: "", type: "USE", quantity: "" });
    } catch (err) {
      console.error(err);
      setMessage("Error processing transaction");
    }
  };

  // ======= CONDITIONAL RENDERING =======
  if (!loggedIn) return <Login setLoggedIn={setLoggedIn} />;
  if (!data) return <h2>Loading...</h2>;

  // ======= CHART DATA =======
  const chartData = {
    labels: data.recentTransactions.map((t) => t.material_name),
    datasets: [
      {
        label: "Transaction Quantity",
        data: data.recentTransactions.map((t) => t.quantity),
        backgroundColor: "#007bff",
      },
    ],
  };

  // ======= MAIN JSX =======
  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      {loggedIn && (
  <button
    onClick={handleLogout}
    style={{
      padding: "5px 15px",
      background: "red",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      float: "right",
      marginBottom: "10px"
    }}
  >
    Logout
  </button>
)}
      <h1>🏭 Rice Mill Dashboard</h1>

      {/* DASHBOARD CARDS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={{ padding: "20px", background: "#f3f3f3", borderRadius: "10px" }}>
          <h3>Total Materials</h3>
          <h2>{data.totalMaterials}</h2>
        </div>

        <div style={{ padding: "20px", background: "#ffe0e0", borderRadius: "10px" }}>
          <h3>Low Stock</h3>
          <h2>{data.lowStockItems}</h2>
        </div>

        <div style={{ padding: "20px", background: "#e0f7ff", borderRadius: "10px" }}>
          <h3>Transactions</h3>
          <h2>{data.totalTransactions}</h2>
        </div>
      </div>

      {/* TRANSACTION CHART */}
      <h2>📊 Transaction Chart</h2>
      <div style={{ width: "500px", marginBottom: "30px" }}>
        <Bar data={chartData} />
      </div>

      {/* INPUT FORM */}
      <h2>Process Transaction</h2>
      {message && (
        <p
          style={{
            color: message.includes("Error") ? "red" : "green",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#f9f9f9",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <select
          value={form.material_id}
          onChange={(e) => setForm({ ...form, material_id: e.target.value })}
          required
          style={{ padding: "10px", borderRadius: "5px" }}
        >
          <option value="">Select Material</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} (Stock: {m.quantity})
              {Number(m.quantity) <= Number(m.reorder_level) ? " ⚠️ LOW STOCK" : ""}
            </option>
          ))}
        </select>

        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          style={{ padding: "10px", borderRadius: "5px" }}
        >
          <option value="USE">USE</option>
          <option value="ADD">ADD</option>
        </select>

        <input
          type="number"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          required
          style={{ padding: "10px", borderRadius: "5px" }}
        />

        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Submit
        </button>
      </form>

      {/* RECENT TRANSACTIONS */}
      <h3>Recent Transactions</h3>
      <ul>
        {data.recentTransactions.map((t, i) => (
          <li key={i}>
            {t.material_name} - {t.type} - {t.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;