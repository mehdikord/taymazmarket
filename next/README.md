# پنل مدیریت — Taymaz Market

Next.js 16 · React 19 · Tailwind 4 · ShadCN UI · **MySQL + Prisma**

## اجرا

```bash
pnpm install
cp .env.example .env.local   # DATABASE_URL و SESSION_SECRET
pnpm db:migrate
pnpm db:seed
pnpm dev
```

| مسیر | توضیح |
|------|--------|
| http://localhost:3000 | داشبورد |
| http://localhost:3000/login | ورود |

## حساب دمو (seed)

| فیلد | مقدار |
|------|--------|
| موبایل | `989121111111` |
| رمز | `admin123` |

مدیر دوم seed: `989122222222` / `admin456`

## اسکریپت‌ها

| دستور | کار |
|--------|-----|
| `pnpm dev` | سرور توسعه |
| `pnpm build` | build تولید |
| `pnpm start` | اجرای build |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | migration توسعه |
| `pnpm db:migrate:deploy` | migration production |
| `pnpm db:seed` | seed دیتابیس |
| `pnpm run verify:api` | تأیید یکپارچه API + MySQL |
| `pnpm run verify:panel` | تأیید کامل پنل + API |
| `pnpm run smoke:qa` | سناریوی QA خودکار |

## Development — بازنشانی دیتابیس

`POST /api/dev/reset` — فقط `NODE_ENV !== production` (seed مجدد MySQL).

دکمه **بازنشانی DB** در footer سایدبار و `/settings/dev`.

## Environment

```bash
cp .env.example .env.local
```

| متغیر | توضیح |
|--------|--------|
| `DATABASE_URL` | اتصال MySQL |
| `SESSION_SECRET` | امضای کوکی session (در production اجباری و قوی) |

## ماژول‌های پنل

| مسیر | ماژول |
|------|--------|
| `/` | داشبورد |
| `/admins` | مدیران |
| `/users` | کاربران |
| `/requests/new` | درخواست‌های جدید |
| `/requests/history` | تاریخچه درخواست‌ها |
| `/settings/currencies` | ارزها |
| `/settings/logs` | لاگ‌ها |

## مستندات

- [PRD](../docs/project-prd.md)
- [API + MySQL تکمیل](../docs/api-tasks/API-DB-COMPLETE.md)
- [برنامه API](../docs/api-tasks/README.md)
- [پنل Mock (UI)](../docs/panel-tasks/PANEL-ADMIN-COMPLETE.md)

## وضعیت

**پنل + API روی MySQL — تکمیل (فاز API ۱–۱۱)**  
جزئیات: [`docs/api-tasks/API-DB-COMPLETE.md`](../docs/api-tasks/API-DB-COMPLETE.md)
