import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, MessageSquare, Calendar, ArrowRight, FileText, PieChart } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { companySettings } = useCompanyTheme();

  return (
    <div className="space-y-16 p-6 pt-1">
      {/* Welcome Header */}
      <section className="py-4 mb-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gradient-primary">
            {companySettings?.name ? `${companySettings.name} Benefits` : "Employee Benefits"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Access information, take surveys, and get personalized support with your benefits - all in one place.
          </p>
          {companySettings?.website && (
            <div className="pt-2">
              <Button asChild variant="outline" className="hover-lift">
                <a href={companySettings.website} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  Visit {companySettings.name} Website <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-lift border-gradient overflow-hidden">
          <CardHeader className="pb-2">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Surveys & Feedback</CardTitle>
            <CardDescription>
              Complete surveys to help us improve your benefits experience and tailor offerings to your needs.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Button asChild variant="link" className="p-0">
              <Link href="/surveys" className="flex items-center text-primary">
                Take a Survey <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover-lift border-gradient overflow-hidden">
          <CardHeader className="pb-2">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>AI Chat Assistant</CardTitle>
            <CardDescription>
              Get immediate answers to your benefits questions with our AI-powered chat assistant.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Button asChild variant="link" className="p-0">
              <Link href="/chat" className="flex items-center text-primary">
                Chat Now <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover-lift border-gradient overflow-hidden">
          <CardHeader className="pb-2">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Benefits Calendar</CardTitle>
            <CardDescription>
              Stay informed about upcoming benefits events, enrollment periods, and important deadlines.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Button asChild variant="link" className="p-0">
              <Link href="/calendar" className="flex items-center text-primary">
                View Calendar <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* Quick Links Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Button asChild variant="outline" className="h-auto py-4 justify-start hover-lift">
            <Link href="/content" className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">Benefits Documents</div>
                <div className="text-xs text-muted-foreground">Access all your benefits guides</div>
              </div>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4 justify-start hover-lift">
            <Link href="/videos" className="flex items-center gap-3">
              <div className="h-5 w-5 flex items-center justify-center text-primary">🎬</div>
              <div className="text-left">
                <div className="font-medium">Benefits Videos</div>
                <div className="text-xs text-muted-foreground">Watch explainer videos</div>
              </div>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4 justify-start hover-lift">
            <Link href="/explore" className="flex items-center gap-3">
              <div className="h-5 w-5 flex items-center justify-center text-primary">🔍</div>
              <div className="text-left">
                <div className="font-medium">Explore Benefits</div>
                <div className="text-xs text-muted-foreground">Discover all available benefits</div>
              </div>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4 justify-start hover-lift">
            <Link href="/surveys" className="flex items-center gap-3">
              <PieChart className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">Survey Results</div>
                <div className="text-xs text-muted-foreground">See engagement analytics</div>
              </div>
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}