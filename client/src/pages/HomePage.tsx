import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  MessageSquare,
  Calendar,
  ArrowRight,
  FileText,
  PieChart,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { companySettings } = useCompanyTheme();

  return (
    <div className="space-y-16 p-6 pt-1">
      {/* Welcome Header */}
      <section className="py-4 mb-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gradient-primary">
            {companySettings?.name
              ? `${companySettings.name} Benefits`
              : "Employee Benefits"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Access information, take surveys, and get personalized support with
            your benefits - all in one place.
          </p>
          {companySettings?.website && (
            <div className="pt-2">
              <Button asChild variant="outline" className="hover-lift">
                <a
                  href={companySettings.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  Visit {companySettings.name} Website{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
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
              Complete surveys to help us improve your benefits experience and
              tailor offerings to your needs.
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
              Get immediate answers to your benefits questions with our
              AI-powered chat assistant.
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
              Stay informed about upcoming benefits events, enrollment periods,
              and important deadlines.
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
    </div>
  );
}
