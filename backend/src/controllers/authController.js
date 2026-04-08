import jwt from "jsonwebtoken";

const SECRET = "mysecretkey"; // later we move this to .env

export const login = (req, res) => {
  const { email, password } = req.body;

  // 🔥 Hardcoded user (for now)
  if (email === "admin@gmail.com" && password === "123456") {
    const token = jwt.sign({ email }, SECRET, { expiresIn: "1h" });

    return res.json({ token });
  }

  return res.status(401).json({ error: "Invalid credentials" });
};