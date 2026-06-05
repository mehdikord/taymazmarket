import { COUNTRIES } from "@/config/countries";
import type { CountryCode } from "@/config/countries";
import { mapCurrency } from "@/lib/db/mappers";
import { toBigIntId } from "@/lib/db/serialize";
import { resolveCountryId } from "@/lib/countries";
import { appendLog } from "@/lib/logging/append-log";
import { LOG_ACTIONS } from "@/lib/logging/actions";
import { prisma } from "@/lib/prisma";
import type { Currency, EntityId } from "@/lib/types";
import type { CreateCurrencyDto, UpdateCurrencyDto } from "@/lib/types/dto";
import type { Prisma } from "@/lib/generated/prisma/client";

export type CurrencyListItem = Currency & {
  countryCode: string;
  countryNameFa: string;
};

type CurrencyWithCountry = Prisma.CurrencyGetPayload<{
  include: { country: true };
}>;

function enrichCurrency(row: CurrencyWithCountry): CurrencyListItem {
  const currency = mapCurrency(row);
  const config = COUNTRIES.find((c) => c.code === row.country.code);
  return {
    ...currency,
    countryCode: row.country.code,
    countryNameFa: config?.name_fa ?? row.country.nameFa,
  };
}

function sortCurrencies(items: CurrencyListItem[]): CurrencyListItem[] {
  return [...items].sort((a, b) => {
    const orderA = a.sortOrder ?? 999;
    const orderB = b.sortOrder ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title, "fa");
  });
}

async function isSlugTaken(
  slug: string,
  excludeId?: EntityId,
): Promise<boolean> {
  const row = await prisma.currency.findFirst({
    where: {
      slug,
      ...(excludeId != null ? { NOT: { id: toBigIntId(excludeId) } } : {}),
    },
    select: { id: true },
  });
  return row != null;
}

async function currencyInUse(id: EntityId): Promise<boolean> {
  const currencyId = toBigIntId(id);
  const count = await prisma.exchangeRequest.count({
    where: {
      OR: [
        { sourceCurrencyId: currencyId },
        { targetCurrencyId: currencyId },
      ],
    },
  });
  return count > 0;
}

export async function listCurrencies(
  activeOnly = false,
): Promise<CurrencyListItem[]> {
  const rows = await prisma.currency.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: { country: true },
  });
  return sortCurrencies(rows.map(enrichCurrency));
}

export async function getCurrency(
  id: EntityId,
): Promise<CurrencyListItem | undefined> {
  const row = await prisma.currency.findUnique({
    where: { id: toBigIntId(id) },
    include: { country: true },
  });
  return row ? enrichCurrency(row) : undefined;
}

export async function createCurrency(
  dto: CreateCurrencyDto,
  actorId: EntityId,
): Promise<CurrencyListItem> {
  const slug = dto.slug.trim().toLowerCase();
  if (await isSlugTaken(slug)) {
    throw new CurrencyServiceError("slug_exists", "این شناسه قبلاً ثبت شده", 409);
  }

  const country = await prisma.country.findUnique({
    where: { id: toBigIntId(dto.countryId) },
  });
  if (!country) {
    throw new CurrencyServiceError("invalid_country", "کشور نامعتبر است", 400);
  }

  const row = await prisma.currency.create({
    data: {
      title: dto.title.trim(),
      slug,
      countryId: country.id,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? null,
    },
    include: { country: true },
  });

  const currency = enrichCurrency(row);

  await appendLog({
    actorType: "admin",
    actorId,
    action: LOG_ACTIONS.currencyCreate,
    entityType: "Currency",
    entityId: currency.id,
    metadata: { slug, title: currency.title },
  });

  return currency;
}

export async function createCurrencyFromCode(
  input: {
    title: string;
    slug: string;
    countryCode: CountryCode;
    isActive?: boolean;
    sortOrder?: number | null;
  },
  actorId: EntityId,
): Promise<CurrencyListItem> {
  const countryId = await resolveCountryId(input.countryCode);
  if (!countryId) {
    throw new CurrencyServiceError("invalid_country", "کشور نامعتبر است", 400);
  }
  return createCurrency(
    {
      title: input.title,
      slug: input.slug,
      countryId,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
    actorId,
  );
}

export async function updateCurrency(
  id: EntityId,
  dto: UpdateCurrencyDto,
  actorId: EntityId,
): Promise<CurrencyListItem> {
  const existing = await prisma.currency.findUnique({
    where: { id: toBigIntId(id) },
  });
  if (!existing) {
    throw new CurrencyServiceError("not_found", "ارز یافت نشد", 404);
  }

  const data: Prisma.CurrencyUpdateInput = {};

  if (dto.slug !== undefined) {
    const slug = dto.slug.trim().toLowerCase();
    if (await isSlugTaken(slug, id)) {
      throw new CurrencyServiceError("slug_exists", "این شناسه قبلاً ثبت شده", 409);
    }
    data.slug = slug;
  }

  if (dto.title !== undefined) {
    data.title = dto.title.trim();
  }

  if (dto.countryId !== undefined) {
    const country = await prisma.country.findUnique({
      where: { id: toBigIntId(dto.countryId) },
    });
    if (!country) {
      throw new CurrencyServiceError("invalid_country", "کشور نامعتبر است", 400);
    }
    data.country = { connect: { id: country.id } };
  }

  if (dto.isActive !== undefined) {
    data.isActive = dto.isActive;
  }

  if (dto.sortOrder !== undefined) {
    data.sortOrder = dto.sortOrder;
  }

  const row = await prisma.currency.update({
    where: { id: toBigIntId(id) },
    data,
    include: { country: true },
  });

  const currency = enrichCurrency(row);

  await appendLog({
    actorType: "admin",
    actorId,
    action: LOG_ACTIONS.currencyUpdate,
    entityType: "Currency",
    entityId: currency.id,
    metadata: { slug: currency.slug, isActive: currency.isActive },
  });

  return currency;
}

export async function updateCurrencyFromCode(
  id: EntityId,
  input: {
    title?: string;
    slug?: string;
    countryCode?: CountryCode;
    isActive?: boolean;
    sortOrder?: number | null;
  },
  actorId: EntityId,
): Promise<CurrencyListItem> {
  const dto: UpdateCurrencyDto = {};
  if (input.title !== undefined) dto.title = input.title;
  if (input.slug !== undefined) dto.slug = input.slug;
  if (input.countryCode !== undefined) {
    const countryId = await resolveCountryId(input.countryCode);
    if (!countryId) {
      throw new CurrencyServiceError("invalid_country", "کشور نامعتبر است", 400);
    }
    dto.countryId = countryId;
  }
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  if (input.sortOrder !== undefined) dto.sortOrder = input.sortOrder;
  return updateCurrency(id, dto, actorId);
}

export async function deleteCurrency(
  id: EntityId,
  actorId: EntityId,
): Promise<void> {
  const existing = await prisma.currency.findUnique({
    where: { id: toBigIntId(id) },
    select: { id: true, slug: true },
  });
  if (!existing) {
    throw new CurrencyServiceError("not_found", "ارز یافت نشد", 404);
  }

  if (await currencyInUse(id)) {
    throw new CurrencyServiceError(
      "in_use",
      "این ارز در درخواست‌ها استفاده شده و قابل حذف نیست",
      409,
    );
  }

  await prisma.currency.delete({ where: { id: existing.id } });

  await appendLog({
    actorType: "admin",
    actorId,
    action: LOG_ACTIONS.currencyDelete,
    entityType: "Currency",
    entityId: id,
    metadata: { slug: existing.slug },
  });
}

export class CurrencyServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "CurrencyServiceError";
  }
}
