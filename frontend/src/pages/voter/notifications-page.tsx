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
  election_start: 'text-success-500 bg-success-100 dark:bg-success-900/30',
  election_end: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
  vote_submitted: 'text-primary-500 bg-primary-100 dark:bg-primary-900/30',
  results_published: 'text-info-500 bg-info-100 dark:bg-info-900/30',
  security_alert: 'text-danger-500 bg-danger-100 dark:bg-danger-900/30',
  system: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
  reminder: 'text-warning-500 bg-warning-100 dark:bg-warning-900/30',
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
          <Skeleton className="h-8 w-48" />
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
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
                  hover
                  className={cn(
                    'cursor-pointer transition-colors',
                    !notification.isRead &&
                      'border-l-4 border-l-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        iconColor
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={cn(
                            'text-sm font-medium',
                            notification.isRead
                              ? 'text-gray-700 dark:text-gray-300'
                              : 'text-gray-900 dark:text-white'
                          )}
                        >
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
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
