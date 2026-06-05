import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api/auth-guard";
import { botConfig } from "@/bot/config";

type Params = { params: Promise<{ userId: string; filename: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { userId, filename } = await params;

  if (!/^\d+$/.test(userId) || filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  const fullPath = path.join(botConfig.uploadDir, userId, filename);

  try {
    const data = await readFile(fullPath);
    const ext = path.extname(filename).toLowerCase();
    const type =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";

    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
