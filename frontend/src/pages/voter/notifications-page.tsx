import { useEffect } from 'react';
import {
  Bell,
  Vote,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  CheckCheck,
} from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { Button, Card, EmptyState } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { useNotificationStore } from '@/store/notification-store';
import type { NotificationType } from '@/types';
import DashboardLayout from '@/layouts/dashboard-layout';

const iconMap: Record<NotificationType, React.ElementType> = {
  election_start: Vote,
  election_end: Clock,
  vote_submitted: CheckCircle,
  results_published: CheckCircle,
  security_alert: AlertTriangle,
  system: Settings,
  reminder: Bell,
};

const iconColorMap: Record<NotificationType, string> = {
  election_start: 'text-accent-600 bg-accent-50',
  election_end: 'text-surface-500 bg-surface-100',
  vote_submitted: 'text-primary-600 bg-primary-50',
  results_published: 'text-accent-600 bg-accent-50',
  security_alert: 'text-danger-500 bg-danger-50',
  system: 'text-surface-500 bg-surface-100',
  reminder: 'text-primary-600 bg-primary-50',
};

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-7 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-primary-700">Notifications</h1>
            <p className="mt-1 text-[14px] text-surface-500">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="border-surface-200 text-primary-600 hover:bg-primary-50 rounded-md">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All as Read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You don't have any notifications yet."
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = iconMap[notification.type];
              const iconColor = iconColorMap[notification.type];

              return (
                <Card
                  key={notification.id}
                  className={cn(
                    'border rounded-lg bg-white cursor-pointer transition-colors',
                    !notification.isRead
                      ? 'border-l-[3px] border-l-primary-500 border-surface-200 bg-primary-50/30'
                      : 'border-surface-200'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        iconColor
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={cn(
                            'text-[14px] font-medium',
                            notification.isRead
                              ? 'text-surface-500'
                              : 'text-primary-700'
                          )}
                        >
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500 mt-1" />
                        )}
                      </div>
                      <p className="mt-1 text-[13px] text-surface-500 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-[12px] text-surface-400">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
