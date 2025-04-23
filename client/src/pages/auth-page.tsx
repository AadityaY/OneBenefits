import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration form schema
const registerFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    const { confirmPassword, ...registrationData } = values;
    registerMutation.mutate(registrationData);
  };

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="grid lg:grid-cols-2 gap-8 w-full max-w-5xl">
        {/* Auth Form */}
        <div className="flex flex-col justify-center">
          <div className="space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Sign in to access your benefits portal
              </p>
            </div>
            
            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>
                      Enter your username and password to access your account
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username"
                          placeholder="Enter your username" 
                          {...loginForm.register("username")} 
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-sm text-red-500">
                            {loginForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                          id="password"
                          type="password" 
                          placeholder="Enter your password" 
                          {...loginForm.register("password")} 
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-500">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Login
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                      Register for a new account to access your benefits
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-username">Username</Label>
                        <Input 
                          id="reg-username"
                          placeholder="Choose a username" 
                          {...registerForm.register("username")} 
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-red-500">
                            {registerForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <Input 
                          id="reg-password"
                          type="password" 
                          placeholder="Create a password" 
                          {...registerForm.register("password")} 
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-500">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input 
                          id="confirm-password"
                          type="password" 
                          placeholder="Confirm your password" 
                          {...registerForm.register("confirmPassword")} 
                        />
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-500">
                            {registerForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Register
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Hero Section */}
        <div className="hidden lg:flex flex-col justify-center">
          <div className="bg-primary/10 p-8 rounded-lg space-y-6">
            <h2 className="text-4xl font-bold text-primary">
              Your one stop shop for all your benefits communications!
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Access important benefits information, take surveys, and get answers to your questions.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Take Surveys</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Provide feedback on your benefits experience
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Ask Questions</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Get instant answers about your benefits
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">View Documents</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Access important benefits documents
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Track Events</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Stay updated on benefit enrollment deadlines
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}