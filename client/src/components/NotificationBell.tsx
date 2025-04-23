import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger, 
} from "@/components/ui/popover";
import { 
  useNotifications, 
  useUnreadNotificationCount, 
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead
} from "@/lib/notificationApi";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCountData, isLoading: isLoadingCount } = useUnreadNotificationCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  
  const unreadCount = unreadCountData?.count || 0;
  
  const handleNotificationClick = (id: number) => {
    markAsRead.mutate(id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative p-2 h-9 w-9">
          <Bell className="h-5 w-5" />
          {!isLoadingCount && unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] flex justify-center items-center bg-primary text-primary-foreground text-xs"
              variant="default"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        alignOffset={-10}
        forceMount
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          {(notifications?.length || 0) > 0 && unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className={cn("max-h-[calc(80vh-12rem)]", "min-h-20")}>
          {isLoading ? (
            <div className="p-4 space-y-4">
              {Array(3).fill(null).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={cn(
                    "border-0 rounded-none flex flex-col p-4 cursor-pointer",
                    !notification.isRead && "bg-accent/50"
                  )}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">{notification.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(notification.createdAt), 'MMM d, yyyy • h:mm a')}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications to show
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}