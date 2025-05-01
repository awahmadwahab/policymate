// Update your script.js submit handler
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            companyName: document.getElementById('companyName').value,
            // Add all other form fields here...
        })
    });

    if (!response.ok) {
        alert('Error: ' + await response.text());
        return;
    }

    const policyText = await response.text();
    document.getElementById('policyPreview').textContent = policyText;
}