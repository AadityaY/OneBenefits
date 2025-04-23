import { HardHat, User } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { user, isAdmin } = useAuth();
  
  // Get the first letter of the username for the avatar
  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : "U";
  
  return (
    <header className="bg-white border-b border-slate-200 py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <span className="text-xl font-semibold text-primary flex items-center cursor-pointer">
            <HardHat className="mr-2" />
            Benefits Portal
          </span>
        </Link>
        
        {user && (
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center">
              <span className="text-sm mr-2">{user.username}</span>
              {isAdmin && (
                <Badge className="bg-primary">Admin</Badge>
              )}
            </div>
            <Avatar className="h-9 w-9 bg-primary/10 text-primary">
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </header>
  );
}
