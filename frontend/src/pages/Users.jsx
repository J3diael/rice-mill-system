import { useState } from "react";
import api, { errorMessage } from "../api.js";
import { useApi } from "../useApi.js";
import { formatDateTime } from "../format.js";
import { Alert, PageHeader } from "../components/ui.jsx";

const blank = { name: "", email: "", password: "", role: "staff" };

export default function Users() {
  const users = useApi("/users", []);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState({ text: "", type: "success" });

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", form);
      setMessage({ text: `Account for ${form.name} created.`, type: "success" });
      setForm(blank);
      users.reload();
    } catch (err) {
      setMessage({ text: errorMessage(err), type: "error" });
    }
  };

  const field = (name) => ({
    value: form[name],
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
  });

  return (
    <>
      <PageHeader title="Users" subtitle="Staff can record stock, milling and sales. Admins can also manage items and users." />
      <Alert
        message={message.text || users.error}
        type={message.text ? message.type : "error"}
        onClose={() => setMessage({ text: "" })}
      />

      <div className="two-col">
        <section className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge">{u.role}</span>
                  </td>
                  <td>{formatDateTime(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <form className="card form" onSubmit={save}>
          <h2>Add a user</h2>
          <label>
            Name
            <input required {...field("name")} />
          </label>
          <label>
            Email
            <input type="email" required {...field("email")} />
          </label>
          <label>
            Temporary password (min. 8 characters)
            <input type="password" minLength={8} required {...field("password")} />
          </label>
          <label>
            Role
            <select {...field("role")}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button className="btn btn-primary">Create account</button>
        </form>
      </div>
    </>
  );
}
