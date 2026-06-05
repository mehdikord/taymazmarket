import type { Context } from "grammy";

export function buildDisplayName(ctx: Context): {
  username?: string | null;
  name?: string | null;
} {
  const from = ctx.from;
  if (!from) return {};
  const parts = [from.first_name, from.last_name].filter(Boolean);
  return {
    username: from.username ?? null,
    name: parts.length > 0 ? parts.join(" ") : null,
  };
}
