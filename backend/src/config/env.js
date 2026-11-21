import "dotenv/config";

const required = ["DATABASE_URL", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing environment variables: ${missing.join(", ")}. Copy backend/.env.example to backend/.env and fill them in.`
  );
}

// Accept a connection string copied with extra text around it,
// e.g. psql 'postgresql://…' or "postgresql://…" or DATABASE_URL=postgresql://…
function cleanDatabaseUrl(raw) {
  const match = raw.match(/postgres(?:ql)?:\/\/[^\s'"]+/);
  if (!match) {
    throw new Error(
      "DATABASE_URL must start with postgresql:// (copy the full connection string from your database provider)"
    );
  }
  return match[0];
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: cleanDatabaseUrl(process.env.DATABASE_URL),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim()),
};
