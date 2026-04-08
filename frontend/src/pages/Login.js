import { useState } from "react";
import axios from "axios";

function Login({ setIsLoggedIn }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false); // Good practice to have a loading state

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Only call the login endpoint here
      const res = await axios.post("http://localhost:5000/api/login", form);

      // 2. Save the token received from the backend
      localStorage.setItem("token", res.data.token);

      // 3. Update the app state to show the dashboard
      setIsLoggedIn(true);
    } catch (err) {
      // 4. Be more specific with errors if possible
      alert(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '10px' }}>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={form.email} // Add this
        required
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        type="password"
        placeholder="Password"
        value={form.password} // Add this
        required
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

export default Login;