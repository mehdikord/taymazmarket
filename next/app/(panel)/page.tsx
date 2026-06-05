import {
  CalendarDays,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import {
  getDashboardStats,
  getRecentLogs,
  getRecentPendingRequests,
} from "@/lib/stats/dashboard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PendingRequestsPreview } from "@/components/dashboard/pending-requests-preview";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RequestStatusChart } from "@/components/dashboard/request-status-chart";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function DashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;

  const [stats, recentLogs, pendingPreview] = await Promise.all([
    getDashboardStats(),
    getRecentLogs(5),
    getRecentPendingRequests(4),
  ]);

  return (
    <div className="space-y-8">
      <DashboardHeader admin={admin} />

      <section aria-label="آمار کلیدی">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="در انتظار تایید"
            value={stats.pendingRequests}
            description="نیاز به بررسی فوری"
            href="/requests/new"
            icon={Clock}
            accent="amber"
          />
          <StatCard
            title="درخواست‌های امروز"
            value={stats.requestsToday}
            description="ثبت‌شده در ۲۴ ساعت اخیر"
            href="/requests/history"
            icon={CalendarDays}
            accent="blue"
          />
          <StatCard
            title="کاربران فعال"
            value={stats.activeUsers}
            description="دارای کد تایید"
            href="/users?tab=active"
            icon={UserCheck}
            accent="emerald"
          />
          <StatCard
            title="کاربران غیرفعال"
            value={stats.inactiveUsers}
            description="در انتظار فعال‌سازی"
            href="/users?tab=inactive"
            icon={UserX}
            accent="slate"
          />
        </div>
      </section>

      <QuickActions />

      <section
        aria-label="جزئیات"
        className="grid gap-6 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <RequestStatusChart
            breakdown={stats.requestBreakdown}
            total={stats.totalRequests}
          />
        </div>
        <div className="lg:col-span-3">
          <RecentActivity logs={recentLogs} />
        </div>
      </section>

      <PendingRequestsPreview requests={pendingPreview} />
    </div>
  );
}
