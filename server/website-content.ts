import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Model for completions
const OPENAI_MODEL = "gpt-4o-mini";

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