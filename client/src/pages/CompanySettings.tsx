import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCompanySettingsSchema } from "@shared/schema";
import { updateCompanySettings, extractColorsFromWebsite } from "@/lib/companySettingsApi";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PaintBucket, ArrowLeft } from "lucide-react";

// Extend the schema for validation
const formSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  logo: z.string().url("Please enter a valid URL").nullable().optional(),
  primaryColor: z.string().min(1, "Primary color is required"),
  secondaryColor: z.string().min(1, "Secondary color is required"),
  accentColor: z.string().min(1, "Accent color is required"),
  website: z.string().url("Please enter a valid URL").nullable().optional(),
  contactEmail: z.string().email("Please enter a valid email").nullable().optional(),
  address: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CompanySettings() {
  const { toast } = useToast();
  const [isExtractingColors, setIsExtractingColors] = useState(false);

  // Fetch company settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/company-settings"],
    queryFn: async () => {
      const response = await fetch("/api/company-settings");
      if (!response.ok) {
        throw new Error("Failed to fetch company settings");
      }
      return response.json();
    },
  });

  // Update company settings mutation
  const updateMutation = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update company settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Set up form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      logo: null,
      primaryColor: "#0f766e",
      secondaryColor: "#0369a1",
      accentColor: "#7c3aed",
      website: "",
      contactEmail: "",
      address: "",
    },
  });

  // When settings data is loaded, update form values
  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name || "Benefits Portal",
        logo: settings.logo,
        primaryColor: settings.primaryColor || "#0f766e",
        secondaryColor: settings.secondaryColor || "#0369a1",
        accentColor: settings.accentColor || "#7c3aed",
        website: settings.website,
        contactEmail: settings.contactEmail,
        address: settings.address,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(values);
  };

  const handleExtractColors = async () => {
    const websiteUrl = form.getValues("website");
    
    if (!websiteUrl) {
      toast({
        title: "Error",
        description: "Please enter a website URL to extract colors from",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExtractingColors(true);
      const colors = await extractColorsFromWebsite(websiteUrl);
      
      form.setValue("primaryColor", colors.primaryColor);
      form.setValue("secondaryColor", colors.secondaryColor);
      form.setValue("accentColor", colors.accentColor);
      
      toast({
        title: "Success",
        description: "Colors extracted from website",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extract colors from website",
        variant: "destructive",
      });
    } finally {
      setIsExtractingColors(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.history.back()}
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Company Settings</h1>
      </div>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>
            Customize how your benefits portal looks and feels for your employees.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Company Name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This name will appear throughout the benefits portal.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Logo URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/logo.png" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a URL to your company logo image (PNG or SVG recommended).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator className="my-6" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Company Colors</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Customize the colors used throughout the portal to match your brand.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              Primary Color
                              <div 
                                className="ml-2 w-4 h-4 rounded-full inline-block" 
                                style={{ backgroundColor: field.value || "#0f766e" }}
                              />
                            </FormLabel>
                            <FormControl>
                              <Input type="color" {...field} value={field.value || "#0f766e"} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              Secondary Color
                              <div 
                                className="ml-2 w-4 h-4 rounded-full inline-block" 
                                style={{ backgroundColor: field.value || "#0369a1" }}
                              />
                            </FormLabel>
                            <FormControl>
                              <Input type="color" {...field} value={field.value || "#0369a1"} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="accentColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              Accent Color
                              <div 
                                className="ml-2 w-4 h-4 rounded-full inline-block" 
                                style={{ backgroundColor: field.value || "#7c3aed" }}
                              />
                            </FormLabel>
                            <FormControl>
                              <Input type="color" {...field} value={field.value || "#7c3aed"} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Website Integration</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Connect your company website to automatically extract brand colors.
                    </p>
                    
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Website</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Input 
                                placeholder="https://yourcompany.com" 
                                {...field} 
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon"
                              onClick={handleExtractColors}
                              disabled={isExtractingColors}
                            >
                              {isExtractingColors ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PaintBucket className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <FormDescription>
                            Enter your company website URL and click the paint icon to extract brand colors.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <h3 className="text-lg font-medium mb-2">Contact Information</h3>
                <p className="text-sm text-gray-500 mb-4">
                  This information will be displayed on the portal for employees to contact your benefits team.
                </p>
                
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="benefits@yourcompany.com" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Email address for benefits-related inquiries.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Company St, City, State 12345" 
                          className="resize-none"
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Physical address of your HR or benefits office.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <CardFooter className="px-0 pt-4 flex justify-end">
                <Button 
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}