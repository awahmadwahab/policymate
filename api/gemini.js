// This file should be placed in the /api folder for serverless deployment

export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    // Get API keys from environment variables - updated to match .env file
    const OPENAI_API_KEY = process.env.AZURE_OPENAI_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "https://saas1748517610.openai.azure.com/";
    const OPENAI_DEPLOYMENT = "gpt-4o";
    const OPENAI_MODEL = "gpt-4o";
    const OPENAI_API_VERSION = "2024-04-01-preview";
    
    // For debugging - log if we have the keys (don't log the actual keys in production)
    console.log("OpenAI API Key available:", !!OPENAI_API_KEY);
    console.log("Gemini API Key available:", !!GEMINI_API_KEY);
    
    if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Server configuration error: Missing API keys' 
      });
    }
  
    try {
      const { 
        websiteName, 
        dataCollected, 
        dataUsage, 
        thirdPartySharing, 
        contactEmail 
      } = req.body;
  
      // Validate required fields
      if (!websiteName || !dataCollected || !dataUsage || !thirdPartySharing || !contactEmail) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      // Format data types collected as a list
      const dataTypes = dataCollected.map(type => {
        switch(type) {
          case 'contact': return 'Contact Information (Name, Email)';
          case 'login': return 'Account Login Details';
          case 'payment': return 'Payment Information';
          case 'cookies': return 'Cookies and Tracking Data';
          case 'location': return 'Location Data';
          case 'usage': return 'Website Usage Statistics';
          default: return type;
        }
      }).join(', ');
  
      // Format third party sharing info
      let sharingInfo = '';
      switch(thirdPartySharing) {
        case 'none':
          sharingInfo = 'No sharing with third parties';
          break;
        case 'limited':
          sharingInfo = 'Limited sharing only with necessary service providers';
          break;
        case 'ads':
          sharingInfo = 'Sharing with advertising partners';
          break;
        case 'extensive':
          sharingInfo = 'Extensive sharing with various third parties';
          break;
        default:
          sharingInfo = thirdPartySharing;
      }
  
      // Create the prompt for both APIs
      const prompt = `
        Create a comprehensive, GDPR-compliant privacy policy for a website with the following details:
        
        Website Name: ${websiteName}
        
        Types of Data Collected: ${dataTypes}
        
        How Data is Used: ${dataUsage}
        
        Third-Party Sharing: ${sharingInfo}
        
        Contact Email for Privacy Concerns: ${contactEmail}
        
        Format the policy with appropriate sections including: Introduction, Data Collection, Data Usage, Data Sharing, 
        User Rights, Data Security, Policy Updates, and Contact Information. Make it professional but easy to understand.
        Don't include any placeholder text like [Your Company] - use the actual website name provided. Make sure to include
        the date of last update as today's date.And does not include key imporvent sections
      `;
      
      let generatedText = '';

      // Try OpenAI API first if key is available
      if (OPENAI_API_KEY) {
        try {
          console.log('Attempting to use OpenAI API...');
          // Call the Azure OpenAI API
          const openaiResponse = await callOpenAI(
            prompt, 
            OPENAI_API_KEY, 
            OPENAI_ENDPOINT,
            OPENAI_DEPLOYMENT,
            OPENAI_API_VERSION
          );
          
          // If successful, use OpenAI's response
          generatedText = openaiResponse;
          console.log('Successfully generated content with OpenAI');
        } catch (openaiError) {
          console.error('OpenAI API error:', openaiError);
          // If OpenAI fails and we have Gemini API key, fall back to Gemini
          if (GEMINI_API_KEY) {
            console.log('Falling back to Gemini API...');
          } else {
            throw openaiError; // Re-throw if we can't fall back
          }
        }
      }

      // If OpenAI didn't work or isn't available, try Gemini API
      if (!generatedText && GEMINI_API_KEY) {
        console.log('Using Gemini API...');
        generatedText = await callGemini(prompt, GEMINI_API_KEY);
      }
  
      if (!generatedText) {
        return res.status(500).json({ 
          error: "The AI services couldn't generate a response. Please try again." 
        });
      }
  
      // Return the generated privacy policy
      return res.status(200).json({ text: generatedText });
  
    } catch (error) {
      console.error('Server error:', error);
      
      // Return error with fallback
      return res.status(500).json({
        error: "An unexpected error occurred while generating your privacy policy.",
        fallback: `We couldn't get a response from our AI services, but here's your input: ${JSON.stringify(req.body)}`
      });
    }
  }

  // Function to call Azure OpenAI API
  async function callOpenAI(prompt, apiKey, endpoint, deploymentName, apiVersion) {
    // Build the correct URL with the provided deployment and API version
    const url = `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    
    console.log(`Calling Azure OpenAI API at: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful assistant that creates privacy policies." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2048,
        top_p: 0.8,
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API error status:', response.status);
      console.error('Azure OpenAI API error details:', errorText);
      throw new Error(`Failed to get response from Azure OpenAI API: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('OpenAI API response structure:', Object.keys(data));
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      console.error('Unexpected response format:', JSON.stringify(data));
      throw new Error('Unexpected response format from Azure OpenAI API');
    }
  }

  // Function to call Gemini API
  async function callGemini(prompt, apiKey) {
    const geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    const response = await fetch(`${geminiApiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error('Failed to get response from Gemini API');
    }

    const data = await response.json();
    
    // Extract the generated text from Gemini's response
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content;
      if (content.parts && content.parts[0] && content.parts[0].text) {
        return content.parts[0].text;
      }
    }
    
    throw new Error('Unexpected response format from Gemini API');
  }