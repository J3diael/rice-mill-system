export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message) => new HttpError(400, message);
export const notFound = (message) => new HttpError(404, message);

export function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw badRequest(`${field} is required`);
  }
  return value.trim();
}

export function optionalText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

export function requireNumber(value, field, { min = 0, allowZero = false } = {}) {
  const number = Number(value);
  if (value === "" || value === null || value === undefined || !Number.isFinite(number)) {
    throw badRequest(`${field} must be a number`);
  }
  if (allowZero ? number < min : number <= min) {
    throw badRequest(`${field} must be ${allowZero ? "at least" : "greater than"} ${min}`);
  }
  return number;
}

export function requireId(value, field) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest(`${field} must be a valid id`);
  }
  return id;
}

export function requireOneOf(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw badRequest(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return value;
}
