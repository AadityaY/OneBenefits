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
    emailCampaignPrompt: companySettings?.emailCampaignPrompt || "Generate engaging email content for benefits campaigns. Focus on clear communication, explaining benefits value, and encouraging employee participation.",
    eventsPrompt: companySettings?.eventsPrompt || "Create descriptive event content for benefits-related meetings, webinars and enrollment periods. Include clear objectives and benefits of attendance.",
    websitePrompt: companySettings?.websitePrompt || "Generate website content that clearly explains employee benefits and resources. Use simple language that enhances understanding and accessibility.",
    videosPrompt: companySettings?.videosPrompt || "Create video script outlines explaining various benefits topics. Include key talking points, visual suggestions, and audience engagement tips.",
    heroTitle: companySettings?.heroTitle || "Simplified",
    heroSubtitle: companySettings?.heroSubtitle || "Benefits Experience",
    heroDescription: companySettings?.heroDescription || "Access information, take surveys, and get personalized support with your employee benefits - all in one place.",
    heroImageUrl: companySettings?.heroImageUrl || "",
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
        emailCampaignPrompt: companySettings.emailCampaignPrompt || "Generate engaging email content for benefits campaigns. Focus on clear communication, explaining benefits value, and encouraging employee participation.",
        eventsPrompt: companySettings.eventsPrompt || "Create descriptive event content for benefits-related meetings, webinars and enrollment periods. Include clear objectives and benefits of attendance.",
        websitePrompt: companySettings.websitePrompt || "Generate website content that clearly explains employee benefits and resources. Use simple language that enhances understanding and accessibility.",
        videosPrompt: companySettings.videosPrompt || "Create video script outlines explaining various benefits topics. Include key talking points, visual suggestions, and audience engagement tips.",
        heroTitle: companySettings.heroTitle || "Simplified",
        heroSubtitle: companySettings.heroSubtitle || "Benefits Experience",
        heroDescription: companySettings.heroDescription || "Access information, take surveys, and get personalized support with your employee benefits - all in one place.",
        heroImageUrl: companySettings.heroImageUrl || "",
      });
    }
  }, [companySettings]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  
  // Handle hero image upload with resize functionality
  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Get the base64 data of the image
        const base64Data = reader.result as string;
        
        // Compress and resize image on the server
        const res = await apiRequest(
          "POST", 
          "/api/resize-image", 
          { 
            image: base64Data,
            maxWidth: 1200,
            maxHeight: 600
          }
        );
        
        if (res.ok) {
          const data = await res.json();
          setFormData(prev => ({ ...prev, heroImageUrl: data.resizedImage }));
          toast({
            title: "Image processed",
            description: "Your image has been optimized for web display.",
          });
        } else {
          // If server processing fails, use the original image
          console.warn("Image processing failed, using original");
          setFormData(prev => ({ ...prev, heroImageUrl: base64Data }));
          toast({
            title: "Image processing warning",
            description: "We couldn't optimize your image. Using original size.",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Error",
        description: "Failed to process the image. Please try again with a smaller image.",
        variant: "destructive",
      });
    }
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
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
            <TabsTrigger value="ai">
              <div className="flex items-center gap-1">
                <span className="text-primary">AI Assistant</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="aiPrompts">
              <div className="flex items-center gap-1">
                <span className="text-primary">AI Prompts</span>
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
              
              <TabsContent value="hero" className="space-y-4 p-0">
                <CardHeader>
                  <CardTitle>Hero Section Settings</CardTitle>
                  <CardDescription>
                    Customize the hero section on your home page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="heroTitle">Hero Title</Label>
                        <Input
                          id="heroTitle"
                          name="heroTitle"
                          value={formData.heroTitle || ""}
                          onChange={handleChange}
                          placeholder="Main heading for hero section"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          This text will be displayed as the main title in gradient colors
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                        <Input
                          id="heroSubtitle"
                          name="heroSubtitle"
                          value={formData.heroSubtitle || ""}
                          onChange={handleChange}
                          placeholder="Subtitle for hero section"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          This text will appear below the main title
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="heroDescription">Hero Description</Label>
                        <Textarea
                          id="heroDescription"
                          name="heroDescription"
                          value={formData.heroDescription || ""}
                          onChange={handleChange}
                          placeholder="Brief description text for the hero section"
                          className="h-24"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          A short paragraph that explains your benefits platform
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="heroImageUrl">Hero Image</Label>
                      <div className="border rounded-md p-4 space-y-4">
                        {formData.heroImageUrl ? (
                          <div className="relative rounded-md overflow-hidden h-52 w-full">
                            <img
                              src={formData.heroImageUrl}
                              alt="Hero image"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-red-500 p-1 rounded-full hover:bg-white/90 transition-colors"
                              onClick={() => setFormData(prev => ({ ...prev, heroImageUrl: "" }))}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
                              </svg>
                              <p className="mt-2 text-sm text-gray-600">No image selected</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-center">
                          <Input
                            id="hero-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleHeroImageUpload}
                            className="hidden"
                          />
                          <Label
                            htmlFor="hero-image-upload"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 cursor-pointer"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {formData.heroImageUrl ? "Change Image" : "Upload Image"}
                          </Label>
                        </div>
                        
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Recommended size: 1200x600px. JPG or PNG format.<br />
                          If no image is provided, the default gallery will be shown.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6 mt-2">
                    <h3 className="text-lg font-medium mb-3">Hero Section Preview</h3>
                    <div className="bg-gray-100 rounded-md p-4 overflow-hidden">
                      <div className="rounded shadow bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h1 className="text-2xl font-bold">
                              <span className="gradient-text">{formData.heroTitle || "Simplified"}</span><br />
                              <span>{formData.heroSubtitle || "Benefits Experience"}</span>
                            </h1>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                              {formData.heroDescription || "Access information, take surveys, and get personalized support with your employee benefits - all in one place."}
                            </p>
                          </div>
                          <div className="flex justify-center">
                            {formData.heroImageUrl ? (
                              <div className="rounded-md overflow-hidden w-full h-24 shadow">
                                <img 
                                  src={formData.heroImageUrl} 
                                  alt="Hero preview" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="text-center rounded-md bg-gray-200 w-full h-24 flex items-center justify-center text-gray-400">
                                <span>People Gallery (Default)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
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
                          <h3 className="text-lg font-semibold text-primary">OpenAI GPT-4o Integration</h3>
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
              
              <TabsContent value="aiPrompts" className="space-y-4 p-0">
                <CardHeader>
                  <CardTitle>AI Prompts Management</CardTitle>
                  <CardDescription>
                    Configure prompts for generating different types of content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="rounded-lg p-4 border-gradient animated-gradient-bg">
                    <div className="bg-background rounded-md p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 9h-1a6 6 0 0 0-12 0H5a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-2a3 3 0 0 0-3-3Z"/><path d="M12 18v4"/><path d="M8 18v4"/><path d="M16 18v4"/></svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-primary">
                            AI Content Generation
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Customize prompts for AI-generated content across your platform
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Surveys Prompt */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/><path d="M8 10h8"/><path d="M8 14h4"/><path d="M8 18h2"/></svg>
                      </div>
                      <h3 className="text-md font-semibold">1. Surveys</h3>
                    </div>
                    <Textarea
                      id="surveyGenerationPrompt"
                      name="surveyGenerationPrompt"
                      value={formData.surveyGenerationPrompt || ""}
                      onChange={handleChange}
                      placeholder="Enter instructions for generating survey templates and questions"
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      This prompt is used to generate survey templates and questions based on uploaded documents and benefits information.
                    </p>
                  </div>

                  {/* Email Campaigns Prompt */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </div>
                      <h3 className="text-md font-semibold">2. Email Campaigns</h3>
                    </div>
                    <Textarea
                      id="emailCampaignPrompt"
                      name="emailCampaignPrompt"
                      value={formData.emailCampaignPrompt || ""}
                      onChange={handleChange}
                      placeholder="Enter instructions for generating email campaign content"
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      This prompt helps generate engaging email content for benefits campaigns and announcements.
                    </p>
                  </div>

                  {/* Events Prompt */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                      </div>
                      <h3 className="text-md font-semibold">3. Events</h3>
                    </div>
                    <Textarea
                      id="eventsPrompt"
                      name="eventsPrompt"
                      value={formData.eventsPrompt || ""}
                      onChange={handleChange}
                      placeholder="Enter instructions for generating events content"
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      This prompt is used to create descriptions for benefits events, webinars, and enrollment periods.
                    </p>
                  </div>

                  {/* Website Content Prompt */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M5 4h14c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H9l-5 3v-3H3.57A2 2 0 0 1 2 16.14V6c0-1.1.9-2 2-2Z"/><path d="M10 10h4"/><path d="M7 15h3"/></svg>
                      </div>
                      <h3 className="text-md font-semibold">4. Website</h3>
                    </div>
                    <Textarea
                      id="websitePrompt"
                      name="websitePrompt"
                      value={formData.websitePrompt || ""}
                      onChange={handleChange}
                      placeholder="Enter instructions for generating website content"
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      This prompt helps generate clear website content that explains employee benefits and resources.
                    </p>
                  </div>

                  {/* Videos Prompt */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m14 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 9"/><path d="M16 6V4a2 2 0 0 0-4 0v2l-3 3 4 4 3-3h7"/></svg>
                      </div>
                      <h3 className="text-md font-semibold">5. Videos</h3>
                    </div>
                    <Textarea
                      id="videosPrompt"
                      name="videosPrompt"
                      value={formData.videosPrompt || ""}
                      onChange={handleChange}
                      placeholder="Enter instructions for generating video script content"
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      This prompt creates video script outlines explaining various benefits topics.
                    </p>
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