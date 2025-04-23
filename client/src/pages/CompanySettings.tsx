import { useState } from "react";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CompanySettings as CompanySettingsType } from "@shared/schema";

export default function CompanySettings() {
  const { settings, isLoading } = useCompanyTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Partial<CompanySettingsType>>({
    name: settings?.name || '',
    primaryColor: settings?.primaryColor || '#0f766e',
    secondaryColor: settings?.secondaryColor || '#0369a1',
    accentColor: settings?.accentColor || '#7c3aed',
    website: settings?.website || '',
    contactEmail: settings?.contactEmail || '',
    address: settings?.address || '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.companyId) {
      toast({
        title: "Error",
        description: "Missing company information",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      await apiRequest('PATCH', '/api/company-settings', {
        ...formData,
        companyId: user.companyId
      });
      
      // Invalidate company settings query to reload data
      queryClient.invalidateQueries({ queryKey: ['/api/company-settings', user.companyId] });
      
      toast({
        title: "Settings saved",
        description: "Company settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Company Settings</h1>
        
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="contact">Contact Information</TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading company settings...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit}>
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Configure basic company information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Company Name</Label>
                      <Input 
                        id="name"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website"
                        name="website"
                        value={formData.website || ''}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="appearance">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize the look and feel of your employee portal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="primaryColor"
                          name="primaryColor"
                          value={formData.primaryColor || ''}
                          onChange={handleInputChange}
                        />
                        <input 
                          type="color" 
                          value={formData.primaryColor || '#0f766e'} 
                          onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-10 h-10 rounded border"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="secondaryColor"
                          name="secondaryColor"
                          value={formData.secondaryColor || ''}
                          onChange={handleInputChange}
                        />
                        <input 
                          type="color" 
                          value={formData.secondaryColor || '#0369a1'} 
                          onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-10 h-10 rounded border"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="accentColor"
                          name="accentColor"
                          value={formData.accentColor || ''}
                          onChange={handleInputChange}
                        />
                        <input 
                          type="color" 
                          value={formData.accentColor || '#7c3aed'} 
                          onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-10 h-10 rounded border"
                        />
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Logo upload functionality will be implemented in the future.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      Set contact information for your company
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input 
                        id="contactEmail"
                        name="contactEmail"
                        value={formData.contactEmail || ''}
                        onChange={handleInputChange}
                        placeholder="contact@example.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input 
                        id="address"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleInputChange}
                        placeholder="Company address"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <div className="mt-6 flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          )}
        </Tabs>
      </main>
    </div>
  );
}