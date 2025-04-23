import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const { settings } = useCompanyTheme();
  
  // Determine if user is admin or superadmin
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  
  // Get initials for avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.username?.substring(0, 2).toUpperCase() || "U";
  };
  
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer">
              {settings?.logo ? (
                <img 
                  src={settings.logo} 
                  alt={`${settings.name} logo`} 
                  className="h-8"
                />
              ) : (
                <div className="text-primary font-bold text-2xl">
                  {settings?.name || "Employee Engage"}
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {user && (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-sm">
                  Dashboard
                </Button>
              </Link>
              
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" className="text-sm">
                    Admin
                  </Button>
                </Link>
              )}
              
              {isAdmin && (
                <Link href="/company-settings">
                  <Button variant="ghost" className="text-sm">
                    Settings
                  </Button>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* User Menu */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar>
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="font-medium">
                  {user.firstName && user.lastName ? 
                    `${user.firstName} ${user.lastName}` : 
                    user.username}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {isAdmin && (
                <Link href="/company-settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Company Settings</span>
                  </DropdownMenuItem>
                </Link>
              )}
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
}