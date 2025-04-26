document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('policyForm');
    const resultBox = document.getElementById('geminiResult');

    form.addEventListener('submit', async function (e) {
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
                other: document.getElementById('otherData').value,
            },
            purpose: {
                service: document.getElementById('purposeService').checked,
                communication: document.getElementById('purposeCommunication').checked,
                marketing: document.getElementById('purposeMarketing').checked,
                analytics: document.getElementById('purposeAnalytics').checked,
                other: document.getElementById('otherPurpose').value,
            },
            storageDuration: document.getElementById('storageDuration').value,
            storageMethod: document.getElementById('storageMethod').value,
            shareData: document.querySelector('input[name="shareData"]:checked').value,
            thirdParties: document.getElementById('thirdParties').value
        };

        resultBox.textContent = 'Generating policy...';

        try {
            const response = await fetch('http://localhost:5000/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            resultBox.textContent = data.result || 'No response from Gemini.';
        } catch (err) {
            console.error(err);
            resultBox.textContent = 'Failed to fetch response.';
        }
    });
});
