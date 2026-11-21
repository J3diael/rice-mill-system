// Turns thrown errors into clean JSON responses.
// Express 5 forwards errors from async route handlers here automatically.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // PostgreSQL constraint errors
  if (err.code === "23505") {
    return res.status(409).json({ error: "That name or email already exists" });
  }
  if (err.code === "23514" || err.code === "23503" || err.code === "22003") {
    return res.status(400).json({ error: "Invalid data" });
  }

  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
