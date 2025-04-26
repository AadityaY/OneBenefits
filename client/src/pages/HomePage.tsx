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

  // Example testimonials data
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Marketing Director",
      image: "https://randomuser.me/api/portraits/women/65.jpg",
      quote: "The benefits portal made everything so simple to understand. I was able to make informed choices for my family."
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Software Engineer",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      quote: "The AI chat assistant answered all my benefits questions immediately, saving me hours of research."
    },
    {
      id: 3,
      name: "Aisha Patel",
      role: "HR Specialist",
      image: "https://randomuser.me/api/portraits/women/45.jpg",
      quote: "Having all our benefits documents in one place has simplified our onboarding process."
    }
  ];

  return (
    <div className="space-y-16 p-6 pt-1">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center gap-8 py-4">
        <div className="flex-1 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gradient-primary">
            Awesome <br/>Benefits Experience
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Access information, take surveys, and get personalized support with 
            your employee benefits - all in one place.
          </p>
        </div>
        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="relative w-[130%]">
            <img 
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=650&q=80" 
              alt="Family enjoying benefits" 
              className="rounded-xl shadow-lg hover-lift object-cover w-full"
            />
            <div className="absolute -bottom-2 -right-2 bg-primary/20 rounded-full p-1 animate-pulse">
              <div className="bg-white rounded-full p-2">
                <div className="h-10 w-10 rounded-full animated-gradient-bg flex items-center justify-center text-primary-foreground font-bold shadow-md">
                  ❤️
                </div>
              </div>
            </div>
            <div className="absolute -top-2 -left-2 bg-secondary/20 rounded-full p-1 animate-pulse">
              <div className="bg-white rounded-full p-2">
                <div className="h-8 w-8 rounded-full animated-gradient-bg flex items-center justify-center text-primary-foreground font-bold shadow-md">
                  💜
                </div>
              </div>
            </div>
          </div>
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

      {/* Testimonials Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">What Our Users Say</h2>
          <p className="text-muted-foreground">Real feedback from employees using our benefits platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover-lift">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-20 w-20 rounded-full overflow-hidden mb-4 border-4 border-primary/10">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="italic mb-4 text-muted-foreground">
                    "{testimonial.quote}"
                  </p>
                  <h3 className="font-medium text-gradient-primary">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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