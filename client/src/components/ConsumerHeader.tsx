import { Link, useLocation } from "wouter";
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
  ChevronDown,
  Menu,
  ClipboardCheck,
  MessageCircle,
  Calendar,
  FileText,
  BarChart
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import benefitsSurveySvg from '../assets/benefits_survey.svg';

export function ConsumerHeader() {
  const { user, logoutMutation } = useAuth();
  const { companySettings } = useCompanyTheme();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation links with icons for consumer experience - ordered per requirement
  const navLinks = [
    { 
      name: "Home", 
      href: "/home", 
      active: location === "/home",
      icon: <div className="h-4 w-4 mr-1 flex items-center justify-center">🏠</div>
    },
    { 
      name: "Explore", 
      href: "/explore", 
      active: location === "/explore",
      icon: <div className="h-4 w-4 mr-1 flex items-center justify-center">🔍</div>
    },
    { 
      name: "Benefits Chat", 
      href: "/chat", 
      active: location === "/chat",
      icon: <MessageCircle className="h-4 w-4 mr-1" />
    },
    { 
      name: "Surveys", 
      href: "/surveys", 
      active: location === "/surveys",
      icon: <ClipboardCheck className="h-4 w-4 mr-1" />
    },
    { 
      name: "Videos", 
      href: "/videos", 
      active: location === "/videos",
      icon: <div className="h-4 w-4 mr-1 flex items-center justify-center">🎬</div>
    },
    { 
      name: "Calendar", 
      href: "/calendar", 
      active: location === "/calendar",
      icon: <Calendar className="h-4 w-4 mr-1" />
    },
    { 
      name: "Documents", 
      href: "/content", 
      active: location === "/content",
      icon: <FileText className="h-4 w-4 mr-1" />
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="z-40 w-full bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and navigation */}
          <div className="flex items-center">
            <div className="flex items-center">
              <Link href="/home" className="flex items-center">
                <div className="h-10 w-10 flex items-center justify-center mr-2 bg-primary/5 rounded">
                  <img src={benefitsSurveySvg} alt="Benefits logo" className="h-8 w-8 object-contain" />
                </div>
                <span className="text-xl font-bold gradient-heading">
                  {companySettings?.name || "Benefits Portal"}
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="ml-10 hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                    link.active 
                      ? "text-primary bg-primary/5" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] sm:w-[350px]">
                <div className="flex flex-col py-6 h-full">
                  <div className="flex items-center mb-8">
                    <Link href="/home" className="flex items-center">
                      <div className="h-10 w-10 flex items-center justify-center mr-2 bg-primary/5 rounded">
                        <img src={benefitsSurveySvg} alt="Benefits logo" className="h-8 w-8 object-contain" />
                      </div>
                      <span className="text-xl font-bold gradient-heading">
                        {companySettings?.name || "Benefits Portal"}
                      </span>
                    </Link>
                  </div>
                  <nav className="flex flex-col space-y-2">
                    {navLinks.map((link) => (
                      <Link 
                        key={link.name} 
                        href={link.href}
                        className={`px-3 py-3 rounded-md text-base font-medium transition-colors flex items-center ${
                          link.active 
                            ? "text-primary bg-primary/5" 
                            : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                        }`}
                      >
                        <div className="mr-3 text-primary opacity-80">
                          {link.icon}
                        </div>
                        <span>{link.name}</span>
                      </Link>
                    ))}
                  </nav>
                  <div className="mt-auto">
                    <Button onClick={handleLogout} variant="destructive" className="w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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
                <DropdownMenuItem className="font-medium">
                  Signed in as <span className="text-gradient-primary">{user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="hover-lift">
                  <Link href="/profile">Profile Settings</Link>
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
      </div>
    </header>
  );
}