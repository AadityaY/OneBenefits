import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Model for completions
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

// Used for generating comprehensive benefit details - using rich content
const OPENAI_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// Define benefit type images for the detail pages
export const BENEFIT_IMAGES = {
  medical: [
    "https://img.freepik.com/free-photo/medical-banner-with-doctor-wearing-stethoscope_23-2149611240.jpg",
    "https://img.freepik.com/free-photo/medical-workers-checking-patient-health_23-2149353294.jpg",
    "https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-hospital-background_1423-1.jpg"
  ],
  dental: [
    "https://img.freepik.com/free-photo/close-up-dentist-s-tools_144627-8499.jpg",
    "https://img.freepik.com/free-photo/dentist-examining-patient-teeth_1098-469.jpg",
    "https://img.freepik.com/free-photo/dentist-looking-patient-s-teeth_1098-456.jpg"
  ],
  vision: [
    "https://img.freepik.com/free-photo/woman-having-her-eyes-examined_23-2148932678.jpg",
    "https://img.freepik.com/free-photo/side-view-eye-doctor-using-equipment-examining-female-patient_23-2148856105.jpg",
    "https://img.freepik.com/free-photo/optometrist-checking-patient-eyesight-giving-her-glasses_1098-559.jpg"
  ],
  retirement: [
    "https://img.freepik.com/free-photo/elderly-couple-meeting-with-financial-advisor_1170-2211.jpg",
    "https://img.freepik.com/free-photo/elderly-couple-having-retirement-budget-consultation-with-financial-advisor_637285-2449.jpg",
    "https://img.freepik.com/free-photo/happy-senior-couple-planning-retirement-home_1170-2208.jpg"
  ],
  additional: [
    "https://img.freepik.com/free-photo/medium-shot-women-working-together_23-2150060036.jpg",
    "https://img.freepik.com/free-photo/medium-shot-happy-colleagues-work_23-2149295535.jpg",
    "https://img.freepik.com/free-photo/happy-business-partners-handshaking_1262-2133.jpg"
  ],
  wellness: [
    "https://img.freepik.com/free-photo/young-woman-doing-fitness-exercises-home_144627-16404.jpg",
    "https://img.freepik.com/free-photo/diverse-people-having-meditation-session_53876-138597.jpg",
    "https://img.freepik.com/free-photo/group-people-working-out-gym_23-2147666156.jpg"
  ],
};

/**
 * Interface for detailed benefit content
 */
export interface BenefitDetailContent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  overview: string;
  eligibility: string;
  howToEnroll: string;
  faq: Array<{question: string, answer: string}>;
  keyContacts: Array<{name: string, role: string, contact: string}>;
  additionalResources: Array<{title: string, description: string, url: string}>;
  images: string[];
}



/**
 * Generate detailed content for a specific benefit type
 * @param benefitType The type of benefit to generate content for (e.g., medical, dental)
 * @param companyName The name of the company
 * @param companyPrompt Company-specific prompt information
 * @returns Detailed benefit content
 */
export async function generateBenefitDetailContent(
  benefitType: string,
  companyName: string,
  companyPrompt: string
): Promise<BenefitDetailContent> {
  try {
    const benefitTypeTitle = {
      medical: "Medical Benefits",
      dental: "Dental Coverage",
      vision: "Vision Care",
      retirement: "Retirement & Financial Planning",
      additional: "Additional Benefits",
      wellness: "Wellness Programs"
    }[benefitType] || "Employee Benefits";

    const prompt = `
You are an expert benefits content writer for ${companyName}. 
Use the following company information to generate detailed content for the ${benefitTypeTitle} page:

${companyPrompt}

Create comprehensive content for a ${benefitTypeTitle} page that includes:
1. A compelling title and subtitle
2. A detailed overview of the ${benefitTypeTitle.toLowerCase()} offered 
3. Eligibility requirements
4. How to enroll in the benefits
5. FAQ section with 3-4 common questions and answers
6. Key contacts for questions about these benefits
7. Additional resources or links that would be helpful

Format your response as a valid JSON object with the following structure:
{
  "id": "${benefitType}",
  "title": "string",
  "subtitle": "string",
  "description": "string (short description for preview cards)",
  "overview": "string (detailed HTML-formatted content)",
  "eligibility": "string (HTML-formatted content)",
  "howToEnroll": "string (HTML-formatted content)",
  "faq": [
    {"question": "string", "answer": "string"}
  ],
  "keyContacts": [
    {"name": "string", "role": "string", "contact": "string"}
  ],
  "additionalResources": [
    {"title": "string", "description": "string", "url": "string"}
  ]
}

For the HTML-formatted content fields (overview, eligibility, howToEnroll):
- Use paragraph tags <p> for text blocks
- Use heading tags <h3>, <h4> for sub-sections
- Use list elements <ul>, <li> for bullet points
- Use <strong> or <em> for emphasis
- Structure content with proper spacing and organization

Your response must be valid JSON that can be parsed using JSON.parse().
Make the content feel authentic and specific to ${companyName}.
Include realistic but fictional names for contacts and resources.
`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2500,
    });

    // Extract the JSON content and ensure it's a string
    const content = response.choices[0].message.content;
    
    if (typeof content === 'string') {
      const parsedContent = JSON.parse(content);
      
      // Format HTML content if needed
      const formatHtmlContent = (html: string) => {
        if (!html.includes('<')) {
          // If no HTML tags, wrap in paragraph tags
          return `<p>${html}</p>`;
        }
        return html;
      };
      
      // Add images to the response and ensure HTML formatting
      return {
        ...parsedContent,
        overview: formatHtmlContent(parsedContent.overview),
        eligibility: formatHtmlContent(parsedContent.eligibility),
        howToEnroll: formatHtmlContent(parsedContent.howToEnroll),
        images: BENEFIT_IMAGES[benefitType as keyof typeof BENEFIT_IMAGES] || []
      };
    }
    
    throw new Error("Invalid response format from OpenAI");
  } catch (error) {
    console.error(`Error generating ${benefitType} content with OpenAI:`, error);
    
    // Return a basic structure if there's an error
    return {
      id: benefitType,
      title: `${benefitType.charAt(0).toUpperCase() + benefitType.slice(1)} Benefits`,
      subtitle: `Your ${companyName} ${benefitType} benefits information`,
      description: `Learn about your ${benefitType} benefits options and how to make the most of them.`,
      overview: `<p>${companyName} offers comprehensive ${benefitType} benefits to support our employees' health and wellbeing.</p>`,
      eligibility: "<p>All full-time employees are eligible for benefits after completing 30 days of employment.</p>",
      howToEnroll: "<p>Enroll through the HR portal during open enrollment or within 30 days of a qualifying life event.</p>",
      faq: [
        {question: "When can I enroll?", answer: "During open enrollment or after a qualifying life event."},
        {question: "Where can I find more information?", answer: "Contact the HR Benefits Team or visit the benefits portal."}
      ],
      keyContacts: [
        {name: "HR Benefits Team", role: "Benefits Administrators", contact: "benefits@example.com"},
        {name: "Jane Smith", role: "Benefits Specialist", contact: "jsmith@example.com"}
      ],
      additionalResources: [
        {title: "Benefits Guide", description: "Download the complete benefits guide", url: "#"},
        {title: "Enrollment Tutorial", description: "Video walkthrough of the enrollment process", url: "#"}
      ],
      images: BENEFIT_IMAGES[benefitType as keyof typeof BENEFIT_IMAGES] || []
    };
  }
}

/**
 * Generate website content based on a company's website prompt
 * @param websitePrompt The prompt to use for generating website content
 * @param companyName The name of the company
 * @returns Generated website content in JSON format with sections and data
 */
export async function generateWebsiteContent(
  websitePrompt: string,
  companyName: string
): Promise<any> {
  try {
    const prompt = `
You are an expert benefits content writer for ${companyName}. 
Use the following instructions to generate detailed benefits website content:

${websitePrompt}

Create a comprehensive benefits website structure with the following sections:
1. Benefits Overview - A general introduction to the company's benefits philosophy
2. Medical Plans - Details about medical insurance options
3. Dental Coverage - Information about dental benefits
4. Vision Plans - Details about vision coverage
5. Retirement Options - Information about 401(k) and retirement benefits
6. Additional Benefits - Other important benefits like FSA, life insurance, etc.
7. Wellness Programs - Information about wellness initiatives and resources

For each section, provide:
- A title 
- A brief description
- 2-3 specific benefits or plans with:
  * Name of the benefit/plan
  * Brief description
  * Key highlights (3-5 bullet points)

Format your response as a valid JSON object with the following structure:
{
  "overview": {
    "title": "string",
    "description": "string"
  },
  "sections": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "plans": [
        {
          "name": "string",
          "description": "string",
          "highlights": ["string", "string", ...]
        }
      ]
    }
  ]
}

Your response must be valid JSON that can be parsed using JSON.parse().
`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2500,
    });

    // Extract the JSON content and ensure it's a string
    const content = response.choices[0].message.content;
    
    // Parse the JSON to validate it
    if (typeof content === 'string') {
      const parsedContent = JSON.parse(content);
      return parsedContent;
    }
    
    throw new Error("Invalid response format from OpenAI");
  } catch (error) {
    console.error("Error generating website content with OpenAI:", error);
    
    // Return a basic structure if there's an error
    return {
      overview: {
        title: `${companyName} Benefits Overview`,
        description: "We offer a comprehensive package of benefits designed to support your health, wellness, and financial security."
      },
      sections: [
        {
          id: "medical",
          title: "Medical Plans",
          description: "Comprehensive healthcare coverage options for you and your family.",
          plans: [
            {
              name: "Premium PPO Plan",
              description: "Our best coverage option with low deductibles and comprehensive benefits.",
              highlights: ["Low deductible", "Extensive network", "Comprehensive prescription coverage"]
            }
          ]
        }
      ]
    };
  }
}