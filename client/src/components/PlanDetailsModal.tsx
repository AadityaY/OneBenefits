import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WebsitePlan } from '@/lib/websiteContentApi';
import { ChevronRight, X } from 'lucide-react';
import { useCompanyTheme } from '@/hooks/use-company-theme';

interface PlanDetailsModalProps {
  plan: WebsitePlan;
  sectionTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({
  plan,
  sectionTitle,
  isOpen,
  onClose
}) => {
  const { colors } = useCompanyTheme();

  // Additional mock data for the detailed view
  // In a real implementation, this could come from a separate API call
  const mockDetails = {
    coverage: {
      inNetwork: '90%',
      outOfNetwork: '70%',
      annualDeductible: '$500 individual / $1,000 family',
      annualMaximum: '$2,500',
    },
    costDetails: {
      employeeOnly: '$25/month',
      employeeAndSpouse: '$50/month',
      employeeAndChildren: '$45/month',
      family: '$70/month',
    },
    additionalInfo: [
      'Preventive care covered at 100%',
      'Access to the nationwide provider network',
      'Online portal for tracking claims and benefits',
      'Mobile app for easy access on the go'
    ]
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold" style={{ color: colors.primary }}>
                {plan.name}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {sectionTitle}
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Description */}
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Overview</h3>
            <p className="text-muted-foreground">{plan.description}</p>
          </div>

          {/* Key Highlights */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Key Highlights</h3>
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
          </div>

          {/* Coverage Details */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Coverage Details</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="font-medium">In-Network Coverage:</div>
              <div>{mockDetails.coverage.inNetwork}</div>
              
              <div className="font-medium">Out-of-Network Coverage:</div>
              <div>{mockDetails.coverage.outOfNetwork}</div>
              
              <div className="font-medium">Annual Deductible:</div>
              <div>{mockDetails.coverage.annualDeductible}</div>
              
              <div className="font-medium">Annual Maximum:</div>
              <div>{mockDetails.coverage.annualMaximum}</div>
            </div>
          </div>

          {/* Cost Details */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Cost Details</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="font-medium">Employee Only:</div>
              <div>{mockDetails.costDetails.employeeOnly}</div>
              
              <div className="font-medium">Employee + Spouse:</div>
              <div>{mockDetails.costDetails.employeeAndSpouse}</div>
              
              <div className="font-medium">Employee + Children:</div>
              <div>{mockDetails.costDetails.employeeAndChildren}</div>
              
              <div className="font-medium">Family:</div>
              <div>{mockDetails.costDetails.family}</div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
            <ul className="space-y-2">
              {mockDetails.additionalInfo.map((info, i) => (
                <li key={i} className="flex items-start">
                  <ChevronRight 
                    className="mr-2 h-5 w-5 mt-0.5 flex-shrink-0" 
                    style={{ color: colors.primary }}
                  />
                  <span>{info}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button 
            style={{ 
              backgroundColor: colors.primary,
              color: 'white',
            }}
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlanDetailsModal;