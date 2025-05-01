const axios = require('axios');

require('dotenv').config(); // Ensure .env file is loaded

/**
 * Generate a privacy policy using the Gemini API
 * @param {Object} policyData - User input data for generating the policy
 * @returns {Promise<string>} - Generated privacy policy HTML
 */
async function generatePolicy(policyData) {
  try {
    // Ensure the API key is loaded properly from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Use the correct API endpoint URL format
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    if (!apiKey) {
      throw new Error('Gemini API key is missing. Please check your .env file.');
    }

    // Construct the prompt for Gemini API
    const prompt = constructPrompt(policyData);

    console.log('Sending request to Gemini API...');
    
    // Make the API request to Gemini 1.5 Flash
    const response = await axios.post(
      `${apiUrl}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH"
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Log successful response
    console.log('Received response from Gemini API');
    
    // Check for valid response
    if (!response.data || !response.data.candidates || !response.data.candidates[0]?.content?.parts) {
      console.error('Invalid API response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('Gemini API response structure is invalid.');
    }

    // Extract the generated text from the response
    let generatedContent = response.data.candidates[0].content.parts[0].text;
    
    // Clean up the response: remove markdown code fences and trim whitespace
    generatedContent = generatedContent.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();
    
    return generatedContent;
  } catch (error) {
    // Log detailed error response for debugging
    console.error('Gemini API Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    throw new Error('Failed to generate privacy policy: ' + (error.response?.data?.error?.message || error.message));
  }
}

/**
 * Construct a prompt for the Gemini API
 * @param {Object} data - User input data
 * @returns {string} - Constructed prompt
 */
function constructPrompt(data) {
  // Ensure the input data is properly formatted
  if (!data.websiteName || !data.contactEmail || !data.dataCollected || !data.dataPurpose) {
    throw new Error('Missing required policy data fields.');
  }

  return `
You are a privacy policy generation expert. Create a detailed, GDPR-compliant privacy policy for a website with the information below.

## Website Information
- Website/Company Name: ${data.websiteName}
- Contact Email: ${data.contactEmail}

## Data Collection and Usage
- Types of data collected: ${data.dataCollected.join(', ')}
- Purpose of data collection: ${data.dataPurpose}
- Data storage duration: ${data.dataRetention || 'Not specified'}
- Third-party data sharing: ${data.dataSharing || 'No'}

## Cookies and Tracking
- Use of cookies: ${data.usesCookies ? 'Yes' : 'No'}
${data.usesCookies ? `- Types of cookies used: ${data.cookieTypes || 'Not specified'}` : ''}

## User Rights
- Specific user rights: ${data.userRights || 'Standard GDPR rights (access, rectification, erasure, restriction, data portability, and objection)'}

## Output Requirements
1. Format the output as clean HTML that can be directly embedded in a website
2. Include all necessary sections for full GDPR compliance
3. Use clear headings and well-structured sections
4. Make the policy professional but easy to understand for average users
5. Include the following sections:
   - Introduction and overview
   - Information collection
   - How information is used
   - Information sharing and disclosure
   - Data retention and storage
   - User rights
   - Cookie policy (if applicable)
   - Changes to the privacy policy
   - Contact information

Output only the clean HTML of the policy with no explanation or additional text before or after.
`;
}

module.exports = {
  generatePolicy
};
