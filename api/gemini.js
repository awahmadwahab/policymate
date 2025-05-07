export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const OPENAI_API_KEY = process.env.AZURE_OPENAI_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "https://saas1748517610.openai.azure.com/";
    const OPENAI_DEPLOYMENT = "gpt-4o";
    const OPENAI_MODEL = "gpt-4o";
    const OPENAI_API_VERSION = "2024-04-01-preview";
    
    console.log("OpenAI API Key available:", !!OPENAI_API_KEY);
    console.log("Gemini API Key available:", !!GEMINI_API_KEY);
    
    if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Server configuration error: Missing API keys' 
      });
    }
  
    try {
      // Server-side input sanitization
      const sanitizeInput = (input) => {
        if (typeof input !== 'string') return input;
        // Remove potential HTML tags
        let sanitized = input.replace(/[<>]/g, '');
        // Remove potential prompt injection attacks with square brackets
        sanitized = sanitized.replace(/\[.*?\]/g, '');
        // Remove other potential injection patterns
        sanitized = sanitized.replace(/forget the (whole|entire) prompt/gi, '');
        sanitized = sanitized.replace(/ignore (previous|all) instructions/gi, '');
        sanitized = sanitized.replace(/do what i tell you/gi, '');
        sanitized = sanitized.replace(/return only/gi, '');
        // Limit reasonable business name length
        return sanitized.substring(0, 100).trim();
      };
      
      const sanitizeObject = (obj) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (Array.isArray(value)) {
            sanitized[key] = value.map(item => typeof item === 'string' ? sanitizeInput(item) : item);
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
          } else if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };
      
      // Sanitize all incoming request data
      const sanitizedBody = sanitizeObject(req.body);
      
      const { 
        websiteName, 
        dataCollected, 
        dataUsage, 
        thirdPartySharing, 
        contactEmail 
      } = sanitizedBody;
  
      if (!websiteName || !dataCollected || !dataUsage || !thirdPartySharing || !contactEmail) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check for potential prompt injection attacks in website name
      if (websiteName.length < 2 || 
          /^[<>{}\[\]]/.test(websiteName) || 
          /forget|ignore|disregard|return|do what i/i.test(websiteName)) {
        return res.status(400).json({ error: 'Invalid company/website name. Please provide a legitimate name.' });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

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

      if (OPENAI_API_KEY) {
        try {
          console.log('Attempting to use OpenAI API...');
          const openaiResponse = await callOpenAI(
            prompt, 
            OPENAI_API_KEY, 
            OPENAI_ENDPOINT,
            OPENAI_DEPLOYMENT,
            OPENAI_API_VERSION
          );
          
          generatedText = openaiResponse;
          console.log('Successfully generated content with OpenAI');
        } catch (openaiError) {
          console.error('OpenAI API error:', openaiError);
          if (GEMINI_API_KEY) {
            console.log('Falling back to Gemini API...');
          } else {
            throw openaiError;
          }
        }
      }

      if (!generatedText && GEMINI_API_KEY) {
        console.log('Using Gemini API...');
        generatedText = await callGemini(prompt, GEMINI_API_KEY);
      }
  
      if (!generatedText) {
        return res.status(500).json({ 
          error: "The AI services couldn't generate a response. Please try again." 
        });
      }
  
      return res.status(200).json({ text: generatedText });
  
    } catch (error) {
      console.error('Server error:', error);
      
      return res.status(500).json({
        error: "An unexpected error occurred while generating your privacy policy.",
        fallback: `We couldn't get a response from our AI services, but here's your input: ${JSON.stringify(req.body)}`
      });
    }
  }

  async function callOpenAI(prompt, apiKey, endpoint, deploymentName, apiVersion) {
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
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content;
      if (content.parts && content.parts[0] && content.parts[0].text) {
        return content.parts[0].text;
      }
    }
    
    throw new Error('Unexpected response format from Gemini API');
  }