import jwt from "jsonwebtoken";

const SECRET = "mysecretkey";

export const login = (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login Data:", email, password);

    if (String(email).trim() === "admin@gmail.com" && String(password).trim() === "123456") {
      const token = jwt.sign({ email }, SECRET, { expiresIn: "1h" });

      return res.json({ token }); // ✅ RESPONSE
    }

    return res.status(401).json({ error: "Invalid credentials" }); // ✅ RESPONSE

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" }); // ✅ RESPONSE
  }
};