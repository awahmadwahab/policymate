const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
    try {
        // 1. Validate API Key
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).send('Missing Gemini API Key');
        }

        // 2. Get input data
        const data = req.body;

        // 3. Validate required fields
        if (!data.companyName || !data.contactEmail) {
            return res.status(400).send('Company name and email are required');
        }

        // 4. Initialize Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // 5. Create prompt
        const prompt = `Generate a professional privacy policy for ${data.companyName} that collects:
        - Names: ${data.collectData.name ? 'Yes' : 'No'}
        - Emails: ${data.collectData.email ? 'Yes' : 'No'}
        - Phones: ${data.collectData.phone ? 'Yes' : 'No'}
        Storage Duration: ${data.storageDuration}
        Third-Party Sharing: ${data.shareData === 'yes' ? data.thirdParties : 'No'}
        Include GDPR and CCPA compliance sections. Use formal legal language.`;

        // 6. Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // 7. Return result
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(response.text());

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error generating policy: ' + error.message);
    }
};