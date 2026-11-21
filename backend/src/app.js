import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "100kb" }));

app.use("/api", routes);
app.use("/api", notFoundHandler);

// In production, the same server also serves the built React app
const frontendDist = fileURLToPath(new URL("../../frontend/dist", import.meta.url));
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    res.sendFile("index.html", { root: frontendDist });
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
