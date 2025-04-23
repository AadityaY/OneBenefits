import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  LogOut, 
  User as UserIcon,
  ChevronDown
} from "lucide-react";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { NotificationBell } from "@/components/NotificationBell";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const { companySettings } = useCompanyTheme();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b glass-effect ml-0 md:ml-64">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Title for current page/section - could be dynamic in the future */}
        <div className="text-xl font-medium gradient-heading">
          Dashboard
        </div>

        {/* User Menu (Right side) */}
        <div className="flex items-center gap-4">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover-lift border-gradient">
                <div className="h-8 w-8 rounded-full animated-gradient-bg flex items-center justify-center text-primary-foreground font-bold shadow-md">
                  {user?.firstName?.substring(0, 1) || user?.username?.substring(0, 1) || "U"}
                </div>
                <div className="hidden sm:block">
                  <span className="block text-sm font-medium">{user?.firstName || user?.username}</span>
                  <span className="block text-xs text-muted-foreground capitalize">{user?.role || "User"}</span>
                </div>
                <ChevronDown className="h-4 w-4 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="frost-glass">
              <DropdownMenuItem className="font-medium text-gradient-primary">
                Signed in as {user?.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="hover-lift">
                <Link to="/profile">Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="hover-lift">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}