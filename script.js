document.addEventListener('DOMContentLoaded', function() {
    const policyForm = document.getElementById('policyForm');
    const previewContainer = document.getElementById('previewContainer');
    const policyPreview = document.getElementById('policyPreview');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareDataRadios = document.querySelectorAll('input[name="shareData"]');
    const thirdPartySection = document.getElementById('thirdPartySection');
    
    policyForm.addEventListener('submit', handleFormSubmit);
    copyBtn.addEventListener('click', copyToClipboard);
    downloadBtn.addEventListener('click', downloadPolicy);
    
    shareDataRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            thirdPartySection.style.display = (this.value === 'yes') ? 'block' : 'none';
        });
    });
    
    // Server URL - change this to match your server's address
    const SERVER_URL = 'http://localhost:5000';
    
    // Check if server is reachable
    checkServerConnection();
    
    function checkServerConnection() {
        fetch(`${SERVER_URL}/health`)
            .then(response => {
                if (response.ok) {
                    console.log('Server is reachable');
                    showMessage('API server connected', 'success');
                } else {
                    console.error('Server returned an error');
                    showMessage('API server returned an error', 'warning');
                }
            })
            .catch(error => {
                console.error('Cannot reach server:', error);
                showMessage('Cannot connect to API server', 'warning');
            });
    }
    
    async function handleFormSubmit(e) {
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
            // Show loading state
            const submitButton = policyForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner"></span> Generating...';
            
            // Try to use the API
            try {
                console.log('Sending request to API...');
                const response = await fetch(`${SERVER_URL}/api/gemini`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('API response received');
                    policyPreview.textContent = data.result;
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`API request failed: ${response.status} ${errorData.error || ''}`);
                }
            } catch (error) {
                console.error('API error:', error);
                // Fallback to local generation
                showMessage(`API unavailable: ${error.message}. Using local generation.`, 'warning');
                const policyText = generatePolicyText(formData);
                policyPreview.textContent = policyText;
            }
            
            previewContainer.style.display = 'block';
            previewContainer.scrollIntoView({ behavior: 'smooth' });
        } finally {
            // Reset button state
            const submitButton = policyForm.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Generate Policy';
        }
    }
    
    function generatePolicyText(formData) {
        let policyText = '';
        const currentDate = new Date().toLocaleDateString();
        
        policyText += `PRIVACY POLICY\n`;
        policyText += `${formData.companyName}\n`;
        policyText += `Last updated: ${currentDate}\n\n`;
        
        policyText += `1. INTRODUCTION\n\n`;
        policyText += `${formData.companyName} We operates the website ${formData.websiteUrl}.\n\n`;
        policyText += `This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.\n\n`;
        policyText += `We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy.\n\n`;
        
        policyText += `2. INFORMATION COLLECTION AND USE\n\n`;
        policyText += `We collect several different types of information for various purposes to provide and improve our Service to you.\n\n`;
        
        policyText += `3. TYPES OF DATA COLLECTED\n\n`;
        policyText += `3.1 Personal Data\n\n`;
        policyText += `While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:\n\n`;
        
        const dataTypes = [];
        if (formData.collectData.name) dataTypes.push('Names');
        if (formData.collectData.email) dataTypes.push('Email addresses');
        if (formData.collectData.phone) dataTypes.push('Phone numbers');
        if (formData.collectData.address) dataTypes.push('Physical addresses');
        if (formData.collectData.ip) dataTypes.push('IP addresses');
        if (formData.collectData.cookies) dataTypes.push('Cookies and usage data');
        
        if (dataTypes.length > 0) {
            dataTypes.forEach(type => {
                policyText += `- ${type}\n`;
            });
            policyText += '\n';
        } else {
            policyText += `We do not collect personally identifiable information.\n\n`;
        }
        
        if (formData.collectData.other) {
            policyText += `We also collect the following information:\n${formData.collectData.other}\n\n`;
        }
        
        policyText += `4. USE OF DATA\n\n`;
        policyText += `${formData.companyName} uses the collected data for various purposes:\n\n`;
        
        const purposes = [];
        if (formData.purpose.service) purposes.push('To provide and maintain our Service');
        if (formData.purpose.communication) purposes.push('To communicate with you');
        if (formData.purpose.marketing) purposes.push('To provide marketing materials and updates');
        if (formData.purpose.analytics) purposes.push('To monitor the usage of our Service and gather analytics');
        
        if (purposes.length > 0) {
            purposes.forEach(purpose => {
                policyText += `- ${purpose}\n`;
            });
            policyText += '\n';
        }
        
        if (formData.purpose.other) {
            policyText += `We also use your data for the following purposes:\n${formData.purpose.other}\n\n`;
        }
        
        policyText += `5. DATA STORAGE AND SECURITY\n\n`;
        
        let storageDurationText;
        switch (formData.storageDuration) {
            case 'necessary':
                storageDurationText = 'as long as necessary for the purposes set out in this Privacy Policy';
                break;
            case '1year':
                storageDurationText = 'for a period of 1 year';
                break;
            case '2years':
                storageDurationText = 'for a period of 2 years';
                break;
            case '5years':
                storageDurationText = 'for a period of 5 years';
                break;
            case 'indefinite':
                storageDurationText = 'indefinitely or until you request its deletion';
                break;
            default:
                storageDurationText = 'as long as necessary for the purposes set out in this Privacy Policy';
        }
        
        policyText += `We retain your personal data ${storageDurationText}.\n\n`;
        
        if (formData.storageMethod) {
            policyText += `Your data is stored and protected as follows:\n${formData.storageMethod}\n\n`;
        } else {
            policyText += `We use industry standard methods to protect your personal information.\n\n`;
        }
        
        policyText += `6. DISCLOSURE OF DATA\n\n`;
        
        if (formData.shareData === 'yes' && formData.thirdParties) {
            policyText += `We may share your personal information with third parties in the following circumstances:\n\n`;
            policyText += `${formData.thirdParties}\n\n`;
        } else {
            policyText += `We do not share your personal information with third parties except as required by law.\n\n`;
        }
        
        policyText += `7. YOUR DATA PROTECTION RIGHTS\n\n`;
        policyText += `Depending on your location and applicable laws, you may have the following rights regarding your personal data:\n\n`;
        policyText += `- The right to access – You have the right to request copies of your personal data.\n`;
        policyText += `- The right to rectification – You have the right to request that we correct any information you believe is inaccurate.\n`;
        policyText += `- The right to erasure – You have the right to request that we erase your personal data, under certain conditions.\n`;
        policyText += `- The right to restrict processing – You have the right to request that we restrict the processing of your personal data, under certain conditions.\n`;
        policyText += `- The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions.\n`;
        policyText += `- The right to data portability – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.\n\n`;
        
        policyText += `8. CONTACT US\n\n`;
        if (formData.contactEmail) {
            policyText += `If you have any questions about this Privacy Policy, please contact us at: ${formData.contactEmail}\n\n`;
        } else {
            policyText += `If you have any questions about this Privacy Policy, please contact us through our website.\n\n`;
        }
        
        return policyText;
    }
    
    function copyToClipboard() {
        const policyText = policyPreview.textContent;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(policyText)
                .then(() => {
                    showMessage('Policy copied to clipboard!', 'success');
                })
                .catch(() => {
                    showMessage('Failed to copy. Please try again.', 'error');
                });
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = policyText;
            textarea.style.position = 'fixed';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            
            try {
                document.execCommand('copy');
                showMessage('Policy copied to clipboard!', 'success');
            } catch (err) {
                showMessage('Failed to copy. Please try again.', 'error');
            }
            
            document.body.removeChild(textarea);
        }
    }
    
    function downloadPolicy() {
        const policyText = policyPreview.textContent;
        const companyName = document.getElementById('companyName').value || 'privacy-policy';
        const filename = `${companyName.toLowerCase().replace(/\s+/g, '-')}-privacy-policy.txt`;
        
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(policyText));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
    
    function showMessage(message, type) {
        let messageElement = document.getElementById('messageAlert');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'messageAlert';
            messageElement.style.position = 'fixed';
            messageElement.style.top = '20px';
            messageElement.style.right = '20px';
            messageElement.style.padding = '10px 20px';
            messageElement.style.borderRadius = '4px';
            messageElement.style.color = 'white';
            messageElement.style.fontWeight = 'bold';
            messageElement.style.zIndex = '1000';
            messageElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            document.body.appendChild(messageElement);
        }
        
        if (type === 'success') {
            messageElement.style.backgroundColor = 'var(--success-color, #4caf50)';
        } else if (type === 'warning') {
            messageElement.style.backgroundColor = 'var(--warning-color, #ff9800)';
        } else {
            messageElement.style.backgroundColor = 'var(--danger-color, #f44336)';
        }
        
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
    }
});