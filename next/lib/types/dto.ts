import type { EntityId, ExchangeRequestStatus } from "./index";

export interface CreateAdminDto {
  name: string;
  mobile: string;
  password: string;
}

export interface UpdateAdminDto {
  name?: string;
  mobile?: string;
  password?: string;
}

export interface CreateUserDto {
  name?: string | null;
  mobile: string;
  verificationCode?: string | null;
  notes?: string | null;
  telegramChatId?: string | null;
  telegramUsername?: string | null;
  profileImageUrl?: string | null;
}

export interface UpdateUserDto {
  name?: string | null;
  mobile?: string;
  verificationCode?: string | null;
  notes?: string | null;
  telegramChatId?: string | null;
  telegramUsername?: string | null;
  profileImageUrl?: string | null;
}

export interface CreateCurrencyDto {
  title: string;
  slug: string;
  countryId: EntityId;
  isActive?: boolean;
  sortOrder?: number | null;
}

export interface UpdateCurrencyDto {
  title?: string;
  slug?: string;
  countryId?: EntityId;
  isActive?: boolean;
  sortOrder?: number | null;
}

export interface RejectRequestDto {
  reason: string;
}

export interface ListRequestsQuery {
  status?: ExchangeRequestStatus | ExchangeRequestStatus[];
  trackingCode?: string;
  userId?: EntityId;
  sourceCurrencyId?: EntityId;
  targetCurrencyId?: EntityId;
  amountMin?: number;
  amountMax?: number;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
}
