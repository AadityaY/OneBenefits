import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { 
  ChevronDown, 
  LayoutDashboard, 
  Settings, 
  ClipboardList, 
  BarChart3, 
  Mail, 
  Calendar, 
  FileText, 
  MessageSquare, 
  LibraryBig,
  Menu,
  X,
  LogOut,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { UserRole } from "@shared/schema";

interface SidebarItem {
  title: string;
  icon: React.ReactNode;
  href: string;
  requiresAdmin?: boolean;
  submenu?: SidebarSubItem[];
  open?: boolean;
}

interface SidebarSubItem {
  title: string;
  href: string;
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { companySettings } = useCompanyTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<SidebarItem[]>([
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: "/",
      open: true,
      submenu: [
        { title: "Take Survey", href: "/take-survey" },
        { title: "Benefits Chat", href: "/chat" },
        { title: "Calendar", href: "/calendar" },
        { title: "Content", href: "/content" },
      ]
    },
    {
      title: "Admin",
      icon: <Settings className="w-5 h-5" />,
      href: "/admin",
      requiresAdmin: true,
      open: false,
      submenu: [
        { title: "Survey Administration", href: "/admin/surveys" },
        { title: "Analytics", href: "/admin/analytics" },
        { title: "Email Campaigns", href: "/admin/email" },
        { title: "Events", href: "/admin/events" },
        { title: "Documents", href: "/admin/documents" },
        { title: "Company Settings", href: "/admin/company-settings" },
      ]
    }
  ]);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const toggleSubmenu = (index: number) => {
    const newMenuItems = [...menuItems];
    newMenuItems[index].open = !newMenuItems[index].open;
    setMenuItems(newMenuItems);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile menu toggle */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        {companySettings?.logo && (
          <img 
            src={companySettings.logo} 
            alt={companySettings?.name || "Company Logo"}
            className="h-8"
          />
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMobileMenu}
          className="hover-lift"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar container */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 flex flex-col w-64 frost-glass shadow-lg border-r z-50 transition-transform duration-300 transform",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo container */}
        <div className="p-4 border-b flex items-center justify-center">
          {companySettings?.logo ? (
            <img 
              src={companySettings.logo} 
              alt={companySettings?.name || "Company Logo"}
              className="h-10"
            />
          ) : (
            <h1 className="text-xl font-bold gradient-heading">
              {companySettings?.name || "Benefits Portal"}
            </h1>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            // Skip admin items for non-admin users
            if (item.requiresAdmin && !isAdmin) return null;

            return (
              <div key={item.title} className="space-y-1">
                {/* Main menu item */}
                <button
                  onClick={() => toggleSubmenu(index)}
                  className={cn(
                    "flex items-center justify-between w-full p-2 rounded-md hover-lift",
                    location.startsWith(item.href) 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-3 font-medium">{item.title}</span>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform", 
                      item.open ? "rotate-180" : ""
                    )} 
                  />
                </button>

                {/* Submenu */}
                {item.open && item.submenu && (
                  <div className="pl-10 space-y-1 mt-1">
                    {item.submenu.map((subItem) => (
                      <div key={subItem.title}>
                        <Link href={subItem.href}>
                          <div 
                            className={cn(
                              "block p-2 rounded-md hover-lift cursor-pointer",
                              location === subItem.href 
                                ? "bg-primary/10 text-primary gradient-border" 
                                : "hover:bg-muted/50"
                            )}
                          >
                            {subItem.title}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.username?.substring(0, 1).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role || "User"}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => logoutMutation.mutate()}
              className="hover-lift text-muted-foreground hover:text-destructive"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}
    </>
  );
}