import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompanyTheme } from "@/hooks/use-company-theme";

// Define category types
type CategoryKey = "medical" | "dental" | "vision" | "retirement" | "fsa" | "life" | "disability" | "wellness" | "perks";

type BenefitPlan = {
  name: string;
  cost: string;
  coverage: string;
  details: string;
  highlights: string[];
};

type CategoryContent = {
  title: string;
  description: string;
  plans: BenefitPlan[];
};

type CategoryContentMap = {
  [key in CategoryKey]: CategoryContent;
};

export default function ExplorePage() {
  const { user } = useAuth();
  const { companySettings } = useCompanyTheme();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("medical");

  // Define benefit categories
  const categories: Array<{id: CategoryKey, name: string}> = [
    { id: "medical", name: "Medical Plans" },
    { id: "dental", name: "Dental Coverage" },
    { id: "vision", name: "Vision Plans" },
    { id: "retirement", name: "401(k) & Retirement" },
    { id: "fsa", name: "FSA & HSA" },
    { id: "life", name: "Life Insurance" },
    { id: "disability", name: "Disability Insurance" },
    { id: "wellness", name: "Wellness Programs" },
    { id: "perks", name: "Additional Perks" },
  ];

  // Define dummy content for each category
  const categoryContent: CategoryContentMap = {
    medical: {
      title: "Medical Insurance Plans",
      description: "Comprehensive healthcare coverage options for you and your family.",
      plans: [
        {
          name: "Premium PPO Plan",
          cost: "$120/month",
          coverage: "Comprehensive coverage with low deductibles",
          details: "The Premium PPO plan offers a wide network of providers, with low copays and deductibles. This plan includes comprehensive prescription drug coverage, preventive care, specialist visits, hospitalization, emergency services, and mental health services.",
          highlights: ["Low $500 deductible", "90% coverage after deductible", "$20 copay for primary care", "$35 copay for specialists", "Nationwide provider network"]
        },
        {
          name: "Standard PPO Plan",
          cost: "$80/month",
          coverage: "Balance of coverage and cost",
          details: "The Standard PPO plan offers a good balance between cost and coverage. It includes a moderate deductible, with good coverage for routine care and emergencies.",
          highlights: ["$1,000 deductible", "80% coverage after deductible", "$30 copay for primary care", "$45 copay for specialists", "Broad provider network"]
        },
        {
          name: "High-Deductible Health Plan with HSA",
          cost: "$40/month",
          coverage: "Lower premiums with HSA option",
          details: "The HDHP offers lower monthly premiums but higher deductibles. It's paired with a Health Savings Account (HSA) that allows you to save pre-tax dollars for medical expenses.",
          highlights: ["$2,500 deductible", "70% coverage after deductible", "HSA eligible", "Company contributes $500 annually to HSA", "Preventive care covered 100%"]
        }
      ]
    },
    dental: {
      title: "Dental Coverage Options",
      description: "Keep your smile healthy with our dental plans.",
      plans: [
        {
          name: "Comprehensive Dental Plan",
          cost: "$25/month",
          coverage: "Full coverage for preventive, basic, and major services",
          details: "The Comprehensive Dental Plan covers preventive care, basic procedures, and major services including orthodontia for both adults and children.",
          highlights: ["100% coverage for preventive care", "80% coverage for basic procedures", "50% coverage for major procedures", "$1,500 annual maximum", "$1,500 lifetime orthodontia benefit"]
        },
        {
          name: "Basic Dental Plan",
          cost: "$15/month",
          coverage: "Coverage for preventive and basic services",
          details: "The Basic Dental Plan focuses on preventive care and basic procedures, with limited coverage for major services.",
          highlights: ["100% coverage for preventive care", "70% coverage for basic procedures", "No coverage for major procedures", "$1,000 annual maximum", "No orthodontia coverage"]
        }
      ]
    },
    vision: {
      title: "Vision Plan Options",
      description: "Take care of your eye health with our vision plans.",
      plans: [
        {
          name: "Enhanced Vision Plan",
          cost: "$10/month",
          coverage: "Comprehensive eye care coverage",
          details: "The Enhanced Vision Plan covers annual eye exams, glasses, contacts, and provides discounts on laser vision correction.",
          highlights: ["$10 copay for annual eye exam", "$150 allowance for frames every 12 months", "$150 allowance for contacts", "40% off additional pairs of glasses", "15% discount on LASIK"]
        },
        {
          name: "Basic Vision Plan",
          cost: "$5/month",
          coverage: "Essential eye care coverage",
          details: "The Basic Vision Plan covers annual eye exams and provides partial coverage for glasses or contacts.",
          highlights: ["$20 copay for annual eye exam", "$100 allowance for frames every 24 months", "$100 allowance for contacts", "20% off additional pairs of glasses"]
        }
      ]
    },
    retirement: {
      title: "401(k) & Retirement Plans",
      description: "Secure your financial future with our retirement options.",
      plans: [
        {
          name: "401(k) Plan",
          cost: "Voluntary contributions",
          coverage: "Tax-advantaged retirement savings",
          details: "Our 401(k) plan allows you to save for retirement with pre-tax dollars. The company matches your contributions up to a certain percentage.",
          highlights: ["100% match on the first 3% you contribute", "50% match on the next 2% you contribute", "Immediate vesting for your contributions", "3-year vesting schedule for company match", "Wide range of investment options"]
        },
        {
          name: "Roth 401(k) Option",
          cost: "Voluntary contributions",
          coverage: "Tax-free growth and withdrawals",
          details: "The Roth 401(k) option allows you to make after-tax contributions now and receive tax-free withdrawals in retirement.",
          highlights: ["Same company match as traditional 401(k)", "Tax-free qualified withdrawals in retirement", "Good option if you expect higher tax rates in retirement", "Can split contributions between traditional and Roth"]
        }
      ]
    },
    fsa: {
      title: "FSA & HSA Options",
      description: "Save money on medical expenses with tax-advantaged accounts.",
      plans: [
        {
          name: "Health Savings Account (HSA)",
          cost: "Voluntary contributions",
          coverage: "Triple tax advantage for medical expenses",
          details: "Available with the High-Deductible Health Plan, the HSA allows you to save pre-tax dollars for medical expenses. Unlike an FSA, HSA funds roll over year to year.",
          highlights: ["2025 contribution limit: $4,150 (individual), $8,300 (family)", "Company contributes $500 annually", "Contributions are tax-deductible", "Growth and withdrawals for qualified expenses are tax-free", "Funds roll over year to year"]
        },
        {
          name: "Healthcare Flexible Spending Account (FSA)",
          cost: "Voluntary contributions",
          coverage: "Pre-tax savings for medical expenses",
          details: "The Healthcare FSA allows you to set aside pre-tax dollars for eligible medical, dental, and vision expenses.",
          highlights: ["2025 contribution limit: $3,200", "Use it or lose it (limited carryover)", "Immediate access to full year's contribution", "Can be used with PPO plans", "Cannot be used with HSA"]
        },
        {
          name: "Dependent Care FSA",
          cost: "Voluntary contributions",
          coverage: "Pre-tax savings for dependent care expenses",
          details: "The Dependent Care FSA allows you to set aside pre-tax dollars for eligible child or elder care expenses.",
          highlights: ["2025 contribution limit: $5,000", "Use it or lose it (no carryover)", "Can be used for children under 13 or eligible dependents", "Eligible expenses include daycare, preschool, summer camps", "Can be used alongside Healthcare FSA or HSA"]
        }
      ]
    },
    life: {
      title: "Life Insurance Options",
      description: "Protect your loved ones with our life insurance plans.",
      plans: [
        {
          name: "Basic Life Insurance",
          cost: "Company-paid",
          coverage: "1x annual salary",
          details: "The company provides basic life insurance coverage at no cost to you. The benefit is equal to your annual salary, up to a maximum of $50,000.",
          highlights: ["No cost to employee", "Automatic enrollment", "Coverage up to $50,000", "Includes accidental death & dismemberment", "Portable if you leave the company (with conversion)"]
        },
        {
          name: "Supplemental Life Insurance",
          cost: "Varies by age and coverage amount",
          coverage: "Additional coverage up to 5x annual salary",
          details: "You can purchase additional life insurance coverage for yourself, your spouse, and your children at group rates.",
          highlights: ["Coverage up to 5x annual salary (max $500,000)", "Spouse coverage up to $250,000", "Child coverage up to $10,000", "Guaranteed issue amounts with no health questions", "Portable if you leave the company"]
        }
      ]
    },
    disability: {
      title: "Disability Insurance",
      description: "Income protection if you're unable to work due to illness or injury.",
      plans: [
        {
          name: "Short-Term Disability",
          cost: "Company-paid",
          coverage: "60% of weekly salary for up to 12 weeks",
          details: "Short-Term Disability provides income replacement if you're unable to work due to a covered illness or injury.",
          highlights: ["7-day waiting period", "60% of weekly salary (max $1,500/week)", "Benefits for up to 12 weeks", "Covers pregnancy and childbirth", "No cost to employee"]
        },
        {
          name: "Long-Term Disability",
          cost: "Company-paid",
          coverage: "60% of monthly salary after 90 days",
          details: "Long-Term Disability provides income replacement for extended disabilities after Short-Term Disability benefits end.",
          highlights: ["90-day waiting period", "60% of monthly salary (max $6,000/month)", "Benefits to age 65 for most disabilities", "Partial disability benefits available", "No cost to employee"]
        }
      ]
    },
    wellness: {
      title: "Wellness Programs",
      description: "Resources to support your physical and mental well-being.",
      plans: [
        {
          name: "Physical Wellness Program",
          cost: "No cost",
          coverage: "Fitness benefits and incentives",
          details: "Our Physical Wellness Program offers resources and incentives to help you maintain and improve your physical health.",
          highlights: ["$50 monthly gym reimbursement", "Annual health assessment with incentives", "Quarterly wellness challenges with prizes", "Discounts on fitness trackers", "On-site fitness classes at select locations"]
        },
        {
          name: "Mental Health Resources",
          cost: "No cost",
          coverage: "Mental health support services",
          details: "We provide comprehensive mental health resources including an Employee Assistance Program and enhanced mental health benefits.",
          highlights: ["Free Employee Assistance Program (8 sessions per issue)", "Reduced copays for mental health visits", "Access to virtual therapy providers", "Stress management workshops", "Meditation app subscription"]
        },
        {
          name: "Financial Wellness",
          cost: "No cost",
          coverage: "Financial education and resources",
          details: "Our Financial Wellness program provides education and resources to help you manage your finances and reduce financial stress.",
          highlights: ["One-on-one financial coaching", "Retirement planning tools", "Student loan repayment assistance ($50/month)", "Financial webinars and workshops", "Discounted financial planning services"]
        }
      ]
    },
    perks: {
      title: "Additional Perks & Benefits",
      description: "Extra benefits that enhance your employee experience.",
      plans: [
        {
          name: "Time Off",
          cost: "No cost",
          coverage: "Paid time away from work",
          details: "Our generous time off policies allow you to rest, travel, and handle personal matters.",
          highlights: ["3 weeks vacation (increasing with tenure)", "10 paid holidays", "2 floating holidays", "5 sick days", "Parental leave: 12 weeks paid for primary caregiver, 4 weeks for secondary"]
        },
        {
          name: "Education Benefits",
          cost: "No cost",
          coverage: "Support for professional development",
          details: "We support your professional growth through tuition assistance and learning opportunities.",
          highlights: ["$5,250 annual tuition reimbursement", "Access to online learning platforms", "Professional certification support", "Internal mentorship program", "Lunch & learn sessions"]
        },
        {
          name: "Work/Life Balance",
          cost: "No cost",
          coverage: "Flexible work arrangements",
          details: "We offer flexible work arrangements to help you balance your professional and personal responsibilities.",
          highlights: ["Hybrid work model (3 days in office, 2 remote)", "Flexible work hours", "Summer Fridays (half-day Fridays in summer)", "Volunteer time off (16 hours per year)", "Employee discount programs"]
        }
      ]
    }
  };

  return (
    <div className="p-6 pt-1">
      <div className="space-y-8">
        <PageHeader 
          title="Explore Your Benefits" 
          description="Learn about all the benefits available to you as an employee."
        />

        <div className="flex flex-col md:flex-row gap-6">
          {/* Side navigation for categories */}
          <Card className="w-full md:w-64 h-fit">
            <CardHeader className="pb-4">
              <CardTitle>Benefit Categories</CardTitle>
            </CardHeader>
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="p-4 space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id as CategoryKey)}
                    className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                      activeCategory === category.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Content area */}
          <div className="flex-1">
            <Card className="border-gradient-soft shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl text-gradient-primary">
                  {categoryContent[activeCategory]?.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {categoryContent[activeCategory]?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {categoryContent[activeCategory]?.plans.map((plan, index) => (
                    <Card key={index} className="overflow-hidden hover-lift transition-all duration-300">
                      <CardHeader className="bg-muted/30 pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <div className="text-sm font-medium text-primary">{plan.cost}</div>
                        </div>
                        <CardDescription className="font-medium text-base">
                          {plan.coverage}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">{plan.details}</p>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Highlights:</h4>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 pl-5 list-disc text-sm">
                              {plan.highlights.map((highlight, i) => (
                                <li key={i}>{highlight}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}