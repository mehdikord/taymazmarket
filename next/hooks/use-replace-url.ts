import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type UseReplaceUrlOptions<TQuery extends object> = {
  toPath: (query: TQuery) => string;
  parse: (searchParamsKey: string) => TQuery;
};

/**
 * همگام‌سازی query string با router.replace — فقط وقتی مسیر واقعاً عوض شود.
 * از searchParams.toString() به‌جای آبجکت searchParams در deps استفاده می‌کند.
 */
export function useReplaceUrl<TQuery extends object>({
  toPath,
  parse,
}: UseReplaceUrlOptions<TQuery>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const syncUrl = useCallback(
    (patch: Partial<TQuery>) => {
      const current = parse(searchParamsKey);
      const next = { ...current, ...patch };
      const target = toPath(next);
      const currentPath = toPath(current);
      if (target === currentPath) return;
      router.replace(target);
    },
    [router, searchParamsKey, parse, toPath],
  );

  return { searchParams, searchParamsKey, syncUrl };
}
