import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/validate.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Please log in"));
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    next(new HttpError(401, "Your session has expired. Please log in again."));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have permission to do that"));
    }
    next();
  };
}
