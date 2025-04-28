import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WebsiteContent, WebsitePlan } from '@/lib/websiteContentApi';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronRight, 
  Heart, 
  Shield, 
  Award, 
  DollarSign, 
  Smile, 
  Activity,
  AlignJustify,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCompanyTheme } from '@/hooks/use-company-theme';
import PlanDetailsModal from '@/components/PlanDetailsModal';

// Map section IDs to icons
const sectionIcons: Record<string, React.ReactNode> = {
  medical: <Activity className="h-6 w-6" />,
  dental: <Smile className="h-6 w-6" />,
  vision: <Shield className="h-6 w-6" />,
  retirement: <DollarSign className="h-6 w-6" />,
  additional: <Award className="h-6 w-6" />,
  wellness: <Heart className="h-6 w-6" />,
};

export default function ExplorePage() {
  const { colors } = useCompanyTheme();
  const [selectedPlan, setSelectedPlan] = useState<WebsitePlan | null>(null);
  const [selectedSectionTitle, setSelectedSectionTitle] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: websiteContent, isLoading, error } = useQuery<WebsiteContent>({
    queryKey: ['/api/website-content'],
  });

  // Function to get icon by section ID
  const getIconForSection = (sectionId: string) => {
    return sectionIcons[sectionId] || <AlignJustify className="h-6 w-6" />;
  };
  
  // Handle plan click to open details modal
  const handlePlanClick = (plan: WebsitePlan, sectionTitle: string) => {
    setSelectedPlan(plan);
    setSelectedSectionTitle(sectionTitle);
    setIsModalOpen(true);
  };
  
  // Close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Error loading content</h2>
        <p>We encountered an issue loading your benefits information. Please try again later.</p>
      </div>
    );
  }

  if (!websiteContent) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">No content available</h2>
        <p>Benefits information is not available at this time. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <div 
        className="rounded-lg overflow-hidden mb-12 p-8 md:p-12"
        style={{ backgroundColor: colors.primary + '15' }}
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.primary }}>
          {websiteContent.overview.title}
        </h1>
        <p className="text-lg md:text-xl max-w-3xl">
          {websiteContent.overview.description}
        </p>
      </div>

      {/* Benefits sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {websiteContent.sections.map((section) => (
          <div key={section.id} className="col-span-1">
            <Card className="h-full shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="p-2 rounded-full" 
                    style={{ backgroundColor: colors.primary + '25' }}
                  >
                    {getIconForSection(section.id)}
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {section.plans.map((plan, index) => (
                  <div 
                    key={plan.name} 
                    className={cn(
                      "pt-4 relative", 
                      index > 0 && "mt-4 border-t border-border"
                    )}
                  >
                    <h3 className="font-semibold text-lg mb-1 group flex items-center cursor-pointer" 
                      onClick={() => handlePlanClick(plan, section.title)}
                    >
                      {plan.name}
                      <ExternalLink 
                        className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" 
                        style={{ color: colors.primary }}
                      />
                    </h3>
                    <p className="text-muted-foreground mb-3">{plan.description}</p>
                    
                    <ul className="space-y-2">
                      {plan.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start">
                          <ChevronRight 
                            className="mr-2 h-5 w-5 mt-0.5 flex-shrink-0" 
                            style={{ color: colors.primary }}
                          />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      variant="ghost"
                      className="mt-4 text-sm font-medium"
                      style={{ color: colors.primary }}
                      onClick={() => handlePlanClick(plan, section.title)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Call to action */}
      <div className="mt-12 text-center">
        <Button 
          size="lg" 
          className="font-semibold"
          style={{ 
            backgroundColor: colors.primary,
            color: 'white',
          }}
        >
          Learn More About Your Benefits
        </Button>
      </div>
      
      {/* Plan Details Modal */}
      {selectedPlan && (
        <PlanDetailsModal
          plan={selectedPlan}
          sectionTitle={selectedSectionTitle}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}