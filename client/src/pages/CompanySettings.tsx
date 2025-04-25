import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CompanySettings as CompanySettingsType } from "@shared/schema";
import { NotificationManagement } from "@/components/NotificationManagement";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, BellRing } from "lucide-react";

export default function CompanySettings() {
  const { companySettings, isLoading } = useCompanyTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  
  // Form state
  const [formData, setFormData] = useState<Partial<CompanySettingsType>>({
    name: companySettings?.name || "",
    address: companySettings?.address || "",
    contactEmail: companySettings?.contactEmail || "",
    website: companySettings?.website || "",
    primaryColor: companySettings?.primaryColor || "#4f46e5",
    secondaryColor: companySettings?.secondaryColor || "#10b981",
    accentColor: companySettings?.accentColor || "#f59e0b",
    logo: companySettings?.logo || "",
    aiAssistantName: companySettings?.aiAssistantName || "Benefits Assistant",
    surveyGenerationPrompt: companySettings?.surveyGenerationPrompt || "As a benefits administrator I would like to create quarterly and annual benefits surveys. Create the questions based on your knowledge as well as the contents of the document uploaded to the assistant. Focus on employee satisfaction, understanding of benefits, and areas for improvement.",
  });
  
  // Update form data when settings load
  useEffect(() => {
    if (companySettings) {
      setFormData({
        name: companySettings.name,
        address: companySettings.address || "",
        contactEmail: companySettings.contactEmail || "",
        website: companySettings.website || "",
        primaryColor: companySettings.primaryColor || "#4f46e5",
        secondaryColor: companySettings.secondaryColor || "#10b981",
        accentColor: companySettings.accentColor || "#f59e0b",
        logo: companySettings.logo || "",
        aiAssistantName: companySettings.aiAssistantName || "Benefits Assistant",
        surveyGenerationPrompt: companySettings.surveyGenerationPrompt || "As a benefits administrator I would like to create quarterly and annual benefits surveys. Create the questions based on your knowledge as well as the contents of the document uploaded to the assistant. Focus on employee satisfaction, understanding of benefits, and areas for improvement.",
      });
    }
  }, [companySettings]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Save settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CompanySettingsType>) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/company-settings?companyId=${companySettings?.companyId}`, 
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      toast({
        title: "Settings updated",
        description: "Company settings have been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };
  
  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!companySettings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Settings Not Found</h1>
        <p className="text-muted-foreground mb-8 text-center">
          Could not load company settings. Please try again later or contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Company Settings</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding & Theme</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
            <TabsTrigger value="ai">
              <div className="flex items-center gap-1">
                <span className="gradient-text">AI Assistant</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <div className="flex items-center gap-1">
                <BellRing className="h-4 w-4" />
                <span>Notifications</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit}>
            <Card>
              <TabsContent value="general" className="space-y-4 p-0">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Basic company information and configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      placeholder="Enter company address"
                    />
                  </div>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="branding" className="space-y-4 p-0">
                <CardHeader>
                  <CardTitle>Branding & Theme</CardTitle>
                  <CardDescription>
                    Customize the look and feel of your company portal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="logo">Company Logo</Label>
                    <div className="flex items-start space-x-4 mt-2">
                      {formData.logo && (
                        <div className="rounded-md overflow-hidden w-24 h-24 flex items-center justify-center border">
                          <img
                            src={formData.logo}
                            alt="Company logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Label
                          htmlFor="logo-upload"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 cursor-pointer"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </Label>
                        <p className="text-sm text-muted-foreground mt-2">
                          Recommended size: 256x256px. PNG or JPG format.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex mt-1">
                        <Input
                          id="primaryColor"
                          name="primaryColor"
                          type="color"
                          value={formData.primaryColor || "#4f46e5"}
                          onChange={handleChange}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          name="primaryColor"
                          value={formData.primaryColor || "#4f46e5"}
                          onChange={handleChange}
                          className="ml-2 flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex mt-1">
                        <Input
                          id="secondaryColor"
                          name="secondaryColor"
                          type="color"
                          value={formData.secondaryColor || "#10b981"}
                          onChange={handleChange}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          name="secondaryColor"
                          value={formData.secondaryColor || "#10b981"}
                          onChange={handleChange}
                          className="ml-2 flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex mt-1">
                        <Input
                          id="accentColor"
                          name="accentColor"
                          type="color"
                          value={formData.accentColor || "#f59e0b"}
                          onChange={handleChange}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          name="accentColor"
                          value={formData.accentColor || "#f59e0b"}
                          onChange={handleChange}
                          className="ml-2 flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="font-medium mb-2">Theme Preview</h3>
                    <div className="flex space-x-3">
                      <div 
                        className="h-12 w-12 rounded-md"
                        style={{ backgroundColor: formData.primaryColor || "#4f46e5" }}
                      />
                      <div 
                        className="h-12 w-12 rounded-md"
                        style={{ backgroundColor: formData.secondaryColor || "#10b981" }}
                      />
                      <div 
                        className="h-12 w-12 rounded-md"
                        style={{ backgroundColor: formData.accentColor || "#f59e0b" }}
                      />
                    </div>
                  </div>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="contact" className="space-y-4 p-0">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Contact details for your company
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail || ""}
                      onChange={handleChange}
                      placeholder="contact@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      value={formData.website || ""}
                      onChange={handleChange}
                      placeholder="https://www.example.com"
                    />
                  </div>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="ai" className="space-y-4 p-0">
                <CardHeader>
                  <CardTitle>AI Assistant Settings</CardTitle>
                  <CardDescription>
                    Configure your OpenAI-powered Benefits Assistant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg p-4 border-gradient animated-gradient-bg">
                    <div className="bg-background rounded-md p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20">
                          <img 
                            src="https://api.dicebear.com/7.x/thumbs/svg?seed=benefits&backgroundColor=b16fef,8d72e6,5e81ea,4588f0&eyes=variant4W14,variant4W15&mouth=variant23,variant24,variant26,variant28" 
                            alt="AI Assistant" 
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold gradient-text">OpenAI GPT-4o Integration</h3>
                          <p className="text-sm text-muted-foreground">
                            Powered by OpenAI's latest large language model
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <Label htmlFor="aiAssistantName">Assistant Name</Label>
                        <Input
                          id="aiAssistantName"
                          name="aiAssistantName"
                          value={formData.aiAssistantName || "Benefits Assistant"}
                          onChange={handleChange}
                          placeholder="Enter a name for your AI assistant"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          This name will be displayed to users in the chat interface
                        </p>
                      </div>
                      
                      <div className="mt-6 text-sm">
                        <h4 className="font-medium text-primary mb-2">How it works</h4>
                        <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                          <li>Your AI assistant uses OpenAI's GPT-4o model to answer employee questions</li>
                          <li>It automatically uses your uploaded benefits documents as context</li>
                          <li>All responses are generated in real-time based on your company's specific information</li>
                          <li>Employees can ask questions about benefits, policies, and procedures</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Survey Generation Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="surveyGenerationPrompt">Survey Generation Prompt</Label>
                        <Textarea
                          id="surveyGenerationPrompt"
                          name="surveyGenerationPrompt"
                          value={formData.surveyGenerationPrompt || ""}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, surveyGenerationPrompt: e.target.value }))}
                          placeholder="Enter instructions for generating survey templates and questions"
                          className="min-h-[120px] mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          This prompt is used when generating survey templates and questions from benefits documents
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="notifications" className="p-0">
                <NotificationManagement />
              </TabsContent>
              
              <div className="flex justify-end p-6 pt-2 border-t">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </Card>
          </form>
        </Tabs>
      </main>
    </div>
  );
}