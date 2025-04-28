import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { useCompanyTheme } from '@/hooks/use-company-theme';
import { getBenefitDetail, BenefitDetail } from '@/lib/websiteContentApi';
import { 
  ArrowLeft, 
  Calendar, 
  Mail, 
  Phone, 
  ExternalLink, 
  FileText,
  Loader2,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BenefitDetailPage() {
  const { benefitId } = useParams();
  const { colors } = useCompanyTheme();
  
  const { data: benefit, isLoading, error } = useQuery<BenefitDetail>({
    queryKey: [`/api/benefit-details/${benefitId}`],
    enabled: !!benefitId,
  });

  // Utility function to safely render HTML content
  const renderHTML = (html: string) => ({ __html: html });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !benefit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error loading content</h2>
          <p>We encountered an issue loading the benefit information. Please try again later.</p>
          <Button className="mt-6" asChild>
            <Link href="/explore">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Benefits
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Determine which image to use as hero
  const heroImage = benefit.images.length > 0 ? benefit.images[0] : '';
  // Other images for the gallery (exclude hero)
  const galleryImages = benefit.images.slice(1);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/explore">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Benefits
          </Link>
        </Button>
      </div>

      {/* Hero Image and Title */}
      <div 
        className="relative rounded-lg overflow-hidden mb-10"
        style={{ height: '350px' }}
      >
        {heroImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ 
              backgroundImage: `url(${heroImage})`,
              filter: 'brightness(0.7)'
            }}
          ></div>
        )}
        <div 
          className="absolute inset-0 flex flex-col justify-center items-center text-center p-6"
          style={{
            background: !heroImage ? `linear-gradient(135deg, ${colors.primary}40, ${colors.primary}90)` : 'transparent'
          }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white drop-shadow-md">
            {benefit.title}
          </h1>
          <p className="text-xl md:text-2xl text-white max-w-3xl font-medium drop-shadow-md">
            {benefit.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-1 lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-3 lg:grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
              <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="pt-4 prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={renderHTML(benefit.overview)} />
            </TabsContent>
            
            <TabsContent value="eligibility" className="pt-4 prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={renderHTML(benefit.eligibility)} />
            </TabsContent>
            
            <TabsContent value="enrollment" className="pt-4 prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={renderHTML(benefit.howToEnroll)} />
            </TabsContent>
            
            <TabsContent value="faq" className="pt-4">
              <div className="space-y-6">
                {benefit.faq.map((item, i) => (
                  <div key={i} className="rounded-lg border p-5">
                    <h3 className="text-lg font-semibold flex items-start">
                      <HelpCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-primary" />
                      {item.question}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="resources" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefit.additionalResources.map((resource, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-primary" />
                        {resource.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 text-sm">
                        {resource.description}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-primary w-full"
                        onClick={() => window.open(resource.url, '_blank')}
                      >
                        View Resource <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="col-span-1 space-y-6">
          {/* Key Contacts Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl" style={{ color: colors.primary }}>
                Key Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {benefit.keyContacts.map((contact, i) => (
                <div key={i} className={i > 0 ? "pt-4 border-t" : ""}>
                  <h3 className="font-semibold">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground">{contact.role}</p>
                  <div className="mt-2 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{contact.contact}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Image Gallery */}
          {galleryImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl" style={{ color: colors.primary }}>
                  More Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {galleryImages.map((image, i) => (
                    <div 
                      key={i} 
                      className="rounded-md overflow-hidden aspect-video bg-cover bg-center"
                      style={{ backgroundImage: `url(${image})` }}
                    ></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Call to Action */}
          <Card 
            style={{ 
              backgroundColor: `${colors.primary}15`,
              borderColor: colors.primary
            }}
          >
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-3" style={{ color: colors.primary }}>
                Need Help?
              </h3>
              <p className="mb-4">
                Have questions about your {benefit.title.toLowerCase()}? Our benefits team is here to help.
              </p>
              <Button 
                style={{ 
                  backgroundColor: colors.primary,
                  color: 'white',
                }}
                className="w-full"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule a Consultation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}