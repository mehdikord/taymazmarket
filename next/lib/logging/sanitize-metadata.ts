/** حداکثر طول رشته در metadata لاگ (PRD §۱۰). */
export const LOG_METADATA_MAX_STRING = 200;

const BLOCKED_KEYS = new Set([
  "password",
  "passwordHash",
  "password_hash",
  "verificationCode",
  "verification_code",
  "token",
  "session",
  "secret",
]);

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.length <= LOG_METADATA_MAX_STRING) return value;
    return `${value.slice(0, LOG_METADATA_MAX_STRING)}…`;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map(sanitizeValue);
  }
  if (value !== null && typeof value === "object") {
    return sanitizeLogMetadata(value as Record<string, unknown>);
  }
  return value;
}

/** حذف فیلدهای حساس و کوتاه‌کردن رشته‌های بلند قبل از insert در `system_logs`. */
export function sanitizeLogMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (BLOCKED_KEYS.has(key)) continue;
    safe[key] = sanitizeValue(value);
  }
  return Object.keys(safe).length > 0 ? safe : undefined;
}
