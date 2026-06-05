import { prisma } from "@/lib/prisma";

/** ۸ رقمی یکتا برای درخواست تبدیل (ربات / API آینده). */
export async function generateTrackingCode(): Promise<string> {
  for (let attempt = 0; attempt < 10_000; attempt++) {
    const code = String(10_000_000 + Math.floor(Math.random() * 90_000_000));
    const exists = await prisma.exchangeRequest.findUnique({
      where: { trackingCode: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error("Unable to generate unique tracking code");
}
