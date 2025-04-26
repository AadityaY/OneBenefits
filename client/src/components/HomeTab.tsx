import { useAuth } from "@/hooks/use-auth";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ClipboardCheck, Calendar, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomeTab() {
  const { user } = useAuth();
  const { companySettings } = useCompanyTheme();

  // Cards for different features
  const featureCards = [
    {
      title: "Explore Benefits",
      description: "Browse through all your benefits options and categories.",
      icon: <div className="h-10 w-10 text-indigo-500 flex items-center justify-center text-3xl">🔍</div>,
      link: "/explore",
      color: "from-indigo-500 to-violet-500"
    },
    {
      title: "Benefits Chat",
      description: "Ask questions about your benefits and get instant answers.",
      icon: <MessageCircle className="h-10 w-10 text-cyan-500" />,
      link: "/chat",
      color: "from-cyan-500 to-blue-500"
    },
    {
      title: "Take a Survey",
      description: "Complete surveys to share your feedback on benefits programs.",
      icon: <ClipboardCheck className="h-10 w-10 text-purple-500" />,
      link: "/surveys",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Benefits Videos",
      description: "Watch informational videos about your benefits options.",
      icon: <div className="h-10 w-10 text-rose-500 flex items-center justify-center text-3xl">🎬</div>,
      link: "/videos",
      color: "from-rose-500 to-red-500"
    },
    {
      title: "Events Calendar",
      description: "View upcoming enrollment periods and benefits events.",
      icon: <Calendar className="h-10 w-10 text-amber-500" />,
      link: "/calendar",
      color: "from-amber-500 to-orange-500"
    },
    {
      title: "Resources & Documents",
      description: "Access your benefits guides and documentation.",
      icon: <FileText className="h-10 w-10 text-emerald-500" />,
      link: "/content",
      color: "from-emerald-500 to-green-500"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Welcome, {user?.firstName || user?.username}</h2>
          <p className="text-gray-600">
            Welcome to your benefits portal. Here you can access information about your benefits,
            complete surveys, view upcoming events, and more.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {featureCards.map((card, index) => (
          <Card key={index} className="overflow-hidden card-hover border-gradient transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  {card.icon}
                </div>
              </div>
              <CardTitle className="text-xl mt-4">{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            
            <CardFooter className="pt-1">
              <Link href={card.link}>
                <Button variant="outline" className="w-full group">
                  <span>Go to {card.title}</span>
                  <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}