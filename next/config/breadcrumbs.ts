export const BREADCRUMB_LABELS: Record<string, string> = {
  "/": "داشبورد",
  "/admins": "مدیران",
  "/users": "کاربران",
  "/requests": "درخواست‌ها",
  "/requests/new": "درخواست‌های جدید",
  "/requests/history": "تاریخچه",
  "/settings": "تنظیمات",
  "/settings/currencies": "ارزها",
  "/settings/logs": "لاگ‌ها",
};

export function getBreadcrumbItems(pathname: string): { href: string; label: string }[] {
  if (pathname === "/") {
    return [{ href: "/", label: BREADCRUMB_LABELS["/"] }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const items: { href: string; label: string }[] = [
    { href: "/", label: "خانه" },
  ];

  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    const label = BREADCRUMB_LABELS[path];
    if (label) {
      items.push({ href: path, label });
    }
  }

  return items;
}
