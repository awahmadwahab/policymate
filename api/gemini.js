import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  

  // Handle POST request
  if (req.method === 'POST') {
    // Get the API key from environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key is not configured' });
    }

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const formData = req.body;

      // Validate required fields
      if (!formData || !formData.companyName) {
        return res.status(400).json({ error: 'Company name is required' });
      }

      // Create prompt for Gemini API
      const prompt = `
A user has submitted the following form data. Generate a complete privacy policy based on this:

Company Name: ${formData.companyName}
Website URL: ${formData.websiteUrl || 'Not specified'}
Contact Email: ${formData.contactEmail || 'Not specified'}

Data Collected:
${formData.collectData ? `
- Name: ${formData.collectData.name}
- Email: ${formData.collectData.email}
- Phone: ${formData.collectData.phone}
- Address: ${formData.collectData.address}
- Cookies: ${formData.collectData.cookies}
- IP Address: ${formData.collectData.ip}
- Other: ${formData.collectData.other || 'None specified'}` : 'None specified'}

Purpose of Collection:
${formData.purpose ? `
- Service: ${formData.purpose.service}
- Communication: ${formData.purpose.communication}
- Marketing: ${formData.purpose.marketing}
- Analytics: ${formData.purpose.analytics}
- Other: ${formData.purpose.other || 'None specified'}` : 'None specified'}

Data Storage Duration: ${formData.storageDuration || 'Not specified'}
Data Storage Method: ${formData.storageMethod || 'Not specified'}

Do they share data with third parties? ${formData.shareData || 'No'}
Third Parties: ${formData.shareData === 'yes' ? (formData.thirdParties || 'Not specified') : 'No'}

Format the policy in plain text with proper sections and headings. Make it comprehensive yet easy to understand.
`;

      // Generate content using Gemini API
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      return res.status(200).json({ result: response });
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return res.status(500).json({ error: 'Failed to generate content' });
    }
  }

  // Handle other HTTP methods
  return res.status(405).json({ error: 'Method not allowed' });
}