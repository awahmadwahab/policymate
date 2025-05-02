// This file should be placed in the /api folder for serverless deployment

export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    // Get API key from environment variables
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ 
        error: 'Server configuration error: Missing API key' 
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
  
      // Create the prompt for Gemini
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
  
      // Call the Gemini 2.0 Flash API
      const geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      
      const response = await fetch(`${geminiApiUrl}?key=${API_KEY}`, {
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
        
        // Return fallback response
        return res.status(500).json({ 
          error: "We couldn't get a response from Gemini at this time.",
          input: req.body
        });
      }
  
      const data = await response.json();
      
      // Extract the generated text from Gemini's response
      let generatedText = '';
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content;
        if (content.parts && content.parts[0] && content.parts[0].text) {
          generatedText = content.parts[0].text;
        }
      }
  
      if (!generatedText) {
        return res.status(500).json({ 
          error: "The AI generated an empty response. Please try again." 
        });
      }
  
      // Return the generated privacy policy
      return res.status(200).json({ text: generatedText });
  
    } catch (error) {
      console.error('Server error:', error);
      
      // Return error with fallback
      return res.status(500).json({
        error: "An unexpected error occurred while generating your privacy policy.",
        fallback: `We couldn't get a response from Gemini, but here's your input: ${JSON.stringify(req.body)}`
      });
    }
  }