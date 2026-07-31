const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://tikitakatoe.ro",
  "https://api.tikitakatoe.ro",
];

const normalizeOrigin = (origin) => {
  if (!origin || typeof origin !== "string") return null;
  return origin.replace(/\/+$/, "").trim();
};

const parseOriginsFromEnv = () => {
  const fromEnv = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) =>
        normalizeOrigin(origin),
      )
    : [];

  const frontendHomeUrl = normalizeOrigin(process.env.FRONTEND_HOME_URL);
  const defaults = DEFAULT_ALLOWED_ORIGINS.map((origin) =>
    normalizeOrigin(origin),
  );

  return Array.from(
    new Set([...defaults, ...fromEnv, frontendHomeUrl].filter(Boolean)),
  );
};

const allowedOrigins = parseOriginsFromEnv();

const isAllowedOrigin = (origin) => {
  // Non-browser clients may not send Origin.
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  if (allowedOrigins.includes(normalized)) return true;

  // Keep Docker/dev flows easy when accessed by host IP.
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return false;
};

module.exports = {
  allowedOrigins,
  isAllowedOrigin,
};
