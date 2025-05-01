const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public'))); // Adjusted path for src directory

// API Routes
// Note: Vercel handles API routes via the /api directory.
// These routes might be handled differently in production on Vercel.
// For local development, we can keep them, but they might need adjustment
// or removal depending on the final Vercel configuration.

// Assuming ./api/gemini exports a function suitable for Express middleware
const geminiApiHandler = require('./api/gemini'); 
if (typeof geminiApiHandler === 'function') {
  // Check if it's the serverless function export or the generatePolicy function
  // This is a basic check, might need refinement based on actual export
  if (geminiApiHandler.length === 2) { // Likely serverless export (req, res)
     // This setup is more for local testing if you want to mimic Vercel's /api structure
     // app.post('/api/gemini', geminiApiHandler);
     console.warn('Local /api/gemini route using Vercel handler structure might not work as expected locally.');
  } else { // Assuming it exports generatePolicy or similar
    // This route structure was used before Vercel API routes were introduced
    app.post('/api/generate', async (req, res) => {
      try {
        const policyData = req.body;
        if (!policyData.websiteName || !policyData.contactEmail) {
          return res.status(400).json({ success: false, error: 'Website name and contact email are required' });
        }
        const generatedPolicy = await geminiApiHandler.generatePolicy(policyData); // Assuming generatePolicy is exported
        res.json({ success: true, policy: generatedPolicy });
      } catch (error) {
        console.error('Error in /api/generate:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to generate policy' });
      }
    });
  }
} else {
  console.error('Could not load ./api/gemini handler');
}

// Assuming ./utils/pdf exports a function suitable for Express middleware
const pdfUtil = require('./utils/pdf');
// This route seems incorrect as pdf.js likely exports generatePDF, not a request handler
// app.post('/api/pdf', pdfUtil);
// Re-implement the PDF generation endpoint logic here if needed for local dev
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { html, websiteName } = req.body;
    if (!html) {
      return res.status(400).json({ success: false, error: 'HTML content is required' });
    }
    const styledHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Privacy Policy - ${websiteName || 'Website'}</title><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;}h1{color:#2c3e50;font-size:24px;margin-top:20px;margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:10px;}h2{color:#2c3e50;font-size:18px;margin-top:20px;margin-bottom:10px;}p{margin-bottom:10px;}ul,ol{margin-bottom:10px;}.footer{text-align:center;font-size:12px;margin-top:20px;color:#777;}</style></head><body>${html}<div class="footer"><p>Privacy Policy for ${websiteName || 'Website'} - Generated on ${new Date().toLocaleDateString()}</p></div></body></html>`;
    const pdfBuffer = await pdfUtil.generatePDF(styledHtml); // Assuming generatePDF is exported
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="privacy-policy-${(websiteName || 'website').toLowerCase().replace(/[^a-z0-9]/gi, '-')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate PDF' });
  }
});


// Fallback route for client-side routing (if applicable)
app.get('*', (req, res) => {
  // Serve index.html for any route not matched by static files or API
  res.sendFile(path.join(__dirname, '../public', 'index.html')); // Adjusted path
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});