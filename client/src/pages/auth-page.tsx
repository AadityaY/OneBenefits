import { useState, useEffect } from "react";
import { useAuth, loginSchema, registerSchema } from "@/hooks/use-auth";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { Redirect } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import benefitsSurveySvg from "../assets/benefits_survey.svg";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { companySettings } = useCompanyTheme();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Redirect to dashboard if already logged in
  if (user) {
    return <Redirect to="/home" />;
  }

  // Use company assistant name or default
  const assistantName =
    companySettings?.aiAssistantName || "Benefits Assistant";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Form Section */}
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 flex items-center justify-center bg-primary/5 rounded">
                {companySettings?.logo ? (
                  <img
                    src={companySettings.logo}
                    alt={`${companySettings.name} logo`}
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <img
                    src={benefitsSurveySvg}
                    alt="Benefits logo"
                    className="h-8 w-8 object-contain"
                  />
                )}
              </div>
              <CardTitle className="text-2xl font-bold gradient-heading">
                {companySettings?.name
                  ? `${companySettings.name} Benefits`
                  : "Welcome to Employee Engage"}
              </CardTitle>
            </div>
            <CardDescription>
              Sign in to{" "}
              {companySettings?.name
                ? `your ${companySettings.name} benefits account`
                : "your account or create a new one"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "login" | "register")
              }
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm
                  isPending={loginMutation.isPending}
                  onSubmit={loginMutation.mutate}
                />
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm
                  isPending={registerMutation.isPending}
                  onSubmit={registerMutation.mutate}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Hero Section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-primary to-primary-foreground text-white p-12 flex flex-col justify-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          {companySettings?.name
            ? `${companySettings.name} Benefits Portal`
            : "Enhance Your Workplace Experience"}
        </h1>
        <p className="text-lg mb-8">
          Access {companySettings?.name ? `${companySettings.name}` : "company"}{" "}
          surveys, benefits information, and organizational resources all in one
          place.
        </p>
        <div className="space-y-4">
          <FeatureItem
            title="Benefits Documentation"
            description={`Access ${companySettings?.name ? `${companySettings.name}` : "your"} benefits information instantly`}
          />
          <FeatureItem
            title="Company Surveys"
            description="Provide valuable feedback to improve workplace culture"
          />
          <FeatureItem
            title={`AI-Powered ${assistantName}`}
            description="Get answers to your benefits questions immediately"
          />
        </div>
      </div>
    </div>
  );
}

function LoginForm({
  isPending,
  onSubmit,
}: {
  isPending: boolean;
  onSubmit: (data: z.infer<typeof loginSchema>) => void;
}) {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isPending} type="submit" className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>

        {/* Demo accounts */}
        <div className="text-sm text-muted-foreground mt-6">
          <p className="font-medium mb-2">Demo Accounts:</p>
          <ul className="space-y-1">
            <li>
              Username: <span className="font-medium">superadmin</span> /
              Password: <span className="font-medium">password</span> (Global
              Access)
            </li>
            <li>
              Username: <span className="font-medium">admin</span> / Password:{" "}
              <span className="font-medium">password</span> (Company Admin)
            </li>
            <li>
              Username: <span className="font-medium">user</span> / Password:{" "}
              <span className="font-medium">password</span> (Regular User)
            </li>
          </ul>
        </div>
      </form>
    </Form>
  );
}

function RegisterForm({
  isPending,
  onSubmit,
}: {
  isPending: boolean;
  onSubmit: (data: z.infer<typeof registerSchema>) => void;
}) {
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      // Default values that don't show in form
      role: "user",
      active: true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="First name"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Last name"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Choose a username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Your email address"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Create a password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isPending} type="submit" className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Register"
          )}
        </Button>
      </form>
    </Form>
  );
}

function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="rounded-full bg-white bg-opacity-20 p-2 mt-1">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 6L9 17L4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-white text-opacity-80">{description}</p>
      </div>
    </div>
  );
}
