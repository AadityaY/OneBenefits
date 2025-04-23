import { useState } from "react";
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
  Menu, 
  Settings, 
  User as UserIcon,
  ChevronDown
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCompanyTheme } from "@/hooks/use-company-theme";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const { companySettings } = useCompanyTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine if user is admin or superadmin
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          {companySettings?.logo ? (
            <img 
              src={companySettings.logo} 
              alt={`${companySettings.name} logo`}
              className="h-8 w-auto" 
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {companySettings?.name?.substring(0, 1) || "E"}
            </div>
          )}
          <span className="font-semibold text-lg hidden md:inline-block">
            {companySettings?.name || "Employee Engage"}
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost">Admin</Button>
            </Link>
          )}

          {isAdmin && (
            <Link to="/company-settings">
              <Button variant="ghost">Company Settings</Button>
            </Link>
          )}
        </nav>

        {/* User Menu (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span>{user?.firstName || user?.username}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="font-medium">
                Signed in as {user?.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile Settings</Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/company-settings">Company Settings</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button size="icon" variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px]">
            <div className="flex flex-col h-full">
              <div className="flex-1 py-4">
                <div className="mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">{user?.firstName || user?.username}</span>
                </div>
                <div className="space-y-3">
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Admin</Button>
                    </Link>
                  )}
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/company-settings" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Company Settings
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                className="justify-start mt-auto" 
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}