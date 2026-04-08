import { useState } from "react";
import axios from "axios";

// Ensure the prop name matches what you passed from App.js
function Login({ setLoggedIn }) { 
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/login", form);

      // 1. Save token
      localStorage.setItem("token", res.data.token);

      // 2. Update state (This was failing because the name was wrong)
      setLoggedIn(true); 
      
    } catch (err) {
      console.error("Login Error:", err);
      // Check if it's a real API error or a code error
      const message = err.response?.data?.message || "Login failed. Please check your credentials.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2 style={{ textAlign: 'center' }}>🏭 Rice Mill Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          required
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          required
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Authenticating..." : "Login"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' },
  form: { display: 'flex', flexDirection: 'column', width: '320px', gap: '15px', padding: '30px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  input: { padding: '12px', borderRadius: '4px', border: '1px solid #ddd' },
  button: { padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Login;