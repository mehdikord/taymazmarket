import type { User, UserStatus } from "@/lib/types";

export type UserTab = "all" | "active" | "inactive";

export type ListUsersQuery = {
  tab?: UserTab;
  q?: string;
  mobile?: string;
  name?: string;
  hasCode?: "true" | "false";
  chatId?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
};

export type ListUsersResult = {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type { UserStatus };
