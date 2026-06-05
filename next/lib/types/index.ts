/** وضعیت درخواست تبدیل */
export type ExchangeRequestStatus = "pending" | "approved" | "rejected";

/** نوع عامل لاگ */
export type LogActorType = "admin" | "user" | "system";

/** فعال / غیرفعال بر اساس verificationCode */
export type UserStatus = "active" | "inactive";

export type EntityId = number;

export interface Country {
  id: EntityId;
  code: string;
  nameFa: string;
  nameEn: string;
  phonePrefix: string;
  createdAt: string;
  updatedAt: string;
}

/** Mock: password فقط در seed/store داخلی — هرگز در API عمومی */
export interface Admin {
  id: EntityId;
  name: string;
  mobile: string;
  password: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AdminPublic = Omit<Admin, "password">;

export interface User {
  id: EntityId;
  name: string | null;
  telegramChatId: string | null;
  telegramUsername: string | null;
  mobile: string;
  profileImageUrl: string | null;
  verificationCode: string | null;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  id: EntityId;
  title: string;
  slug: string;
  countryId: EntityId;
  isActive: boolean;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserBankAccount {
  id: EntityId;
  userId: EntityId;
  currencyId: EntityId;
  accountNumber: string;
  label: string | null;
  createdAt: string;
}

export interface ExchangeRequest {
  id: EntityId;
  trackingCode: string;
  userId: EntityId;
  sourceCurrencyId: EntityId;
  targetCurrencyId: EntityId;
  amount: number;
  bankAccount: string;
  invoiceImageUrl: string;
  status: ExchangeRequestStatus;
  rejectionReason: string | null;
  reviewedById: EntityId | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SystemLog {
  id: EntityId;
  actorType: LogActorType;
  actorId: EntityId | null;
  action: string;
  entityType: string;
  entityId: EntityId | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function getUserStatus(user: User): UserStatus {
  return user.verificationCode ? "active" : "inactive";
}

export function toAdminPublic(admin: Admin): AdminPublic {
  return {
    id: admin.id,
    name: admin.name,
    mobile: admin.mobile,
    deletedAt: admin.deletedAt,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}
