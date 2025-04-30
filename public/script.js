document.addEventListener('DOMContentLoaded', function() {
    const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';
    
    const policyForm = document.getElementById('policyForm');
    const previewContainer = document.getElementById('previewContainer');
    const policyPreview = document.getElementById('policyPreview');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    policyForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            companyName: document.getElementById('companyName').value,
            websiteUrl: document.getElementById('websiteUrl').value,
            contactEmail: document.getElementById('contactEmail').value,
            collectData: {
                name: document.getElementById('collectName').checked,
                email: document.getElementById('collectEmail').checked,
                phone: document.getElementById('collectPhone').checked,
                address: document.getElementById('collectAddress').checked,
                cookies: document.getElementById('collectCookies').checked,
                ip: document.getElementById('collectIp').checked,
                other: document.getElementById('otherData').value
            },
            purpose: {
                service: document.getElementById('purposeService').checked,
                communication: document.getElementById('purposeCommunication').checked,
                marketing: document.getElementById('purposeMarketing').checked,
                analytics: document.getElementById('purposeAnalytics').checked,
                other: document.getElementById('otherPurpose').value
            },
            storageDuration: document.getElementById('storageDuration').value,
            storageMethod: document.getElementById('storageMethod').value,
            shareData: document.querySelector('input[name="shareData"]:checked').value,
            thirdParties: document.getElementById('thirdParties').value
        };

        try {
            const response = await fetch(`${API_URL}/generate-policy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to generate policy');
            
            const policyText = await response.text();
            policyPreview.textContent = policyText;
            previewContainer.style.display = 'block';
            previewContainer.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate policy. Please try again.');
        }
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(policyPreview.textContent);
            alert('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    });

    downloadBtn.addEventListener('click', () => {
        const text = policyPreview.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'privacy-policy.txt';
        a.click();
        URL.revokeObjectURL(url);
    });
});