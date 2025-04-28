import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BenefitDetail } from "@/lib/websiteContentApi";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Calendar, Download, Mail } from "lucide-react";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function BenefitDetailPage() {
  const { benefitId } = useParams();
  const { user } = useAuth();
  
  // Fetch the benefit details from the API
  const { data: benefitDetail, isLoading, error } = useQuery<BenefitDetail>({
    queryKey: [`/api/benefit-details/${benefitId}`],
    enabled: !!benefitId && !!user,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !benefitDetail) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center p-8 rounded-lg border bg-background">
          <h1 className="text-2xl font-bold mb-4">Error Loading Benefit Details</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't load the details for this benefit. Please try again later.
          </p>
          <Link href="/explore">
            <Button>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Benefits
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/explore">
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Benefits
          </Button>
        </Link>
      </div>
      
      {/* Hero section with title and image */}
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{benefitDetail.title}</h1>
          <p className="text-lg text-muted-foreground mb-4">{benefitDetail.subtitle}</p>
          <p className="mb-6">{benefitDetail.description}</p>
          <div className="flex gap-3">
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Enroll Now
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Guide
            </Button>
          </div>
        </div>
        <div className="flex-1 rounded-lg overflow-hidden max-h-80">
          {benefitDetail.images && benefitDetail.images.length > 0 && (
            <img 
              src={benefitDetail.images[0]} 
              alt={benefitDetail.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>

      {/* Content tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <div 
            className="prose max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: benefitDetail.overview }}
          />

          <h2 className="text-2xl font-semibold mb-4">Eligibility</h2>
          <div 
            className="prose max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: benefitDetail.eligibility }}
          />

          <h2 className="text-2xl font-semibold mb-4">How to Enroll</h2>
          <div 
            className="prose max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: benefitDetail.howToEnroll }}
          />

          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="mb-8">
            {benefitDetail.faq.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p>{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        <div>
          {/* Sidebar with contacts and resources */}
          <div className="bg-muted p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">Key Contacts</h3>
            {benefitDetail.keyContacts.map((contact, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.role}</p>
                <div className="flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-1" />
                  <a 
                    href={`mailto:${contact.contact}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {contact.contact}
                  </a>
                </div>
                {index < benefitDetail.keyContacts.length - 1 && (
                  <Separator className="my-3" />
                )}
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold mb-4">Additional Resources</h3>
          <div className="space-y-3">
            {benefitDetail.additionalResources.map((resource, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <h4 className="font-semibold">{resource.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                  <a 
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Access Resource
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Image gallery */}
          {benefitDetail.images && benefitDetail.images.length > 1 && (
            <>
              <h3 className="text-xl font-semibold my-6">Images</h3>
              <div className="grid grid-cols-2 gap-3">
                {benefitDetail.images.slice(1).map((image, index) => (
                  <div key={index} className="rounded-md overflow-hidden h-24">
                    <img 
                      src={image}
                      alt={`${benefitDetail.title} image ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}