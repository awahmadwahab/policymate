document.addEventListener('DOMContentLoaded', function () {
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
      radio.addEventListener('change', function () {
        thirdPartySection.style.display = this.value === 'yes' ? 'block' : 'none';
      });
    });
  
    // Use the current domain for the backend API
    const SERVER_URL = '';
  
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
        const submitButton = policyForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner"></span> Generating...';
  
        const response = await fetch(`${SERVER_URL}/api/gemini`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
  
        if (response.ok) {
          const data = await response.json();
          policyPreview.textContent = data.result;
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API request failed: ${response.status} ${errorData.error || ''}`);
        }
  
        previewContainer.style.display = 'block';
        previewContainer.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        console.error('API error:', error);
        showMessage(`API unavailable: ${error.message}. Please try again later.`, 'warning');
      } finally {
        const submitButton = policyForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Generate Policy';
      }
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
  
      messageElement.style.backgroundColor = type === 'success' ? '#4caf50' : '#f44336';
      messageElement.textContent = message;
      messageElement.style.display = 'block';
  
      setTimeout(() => {
        messageElement.style.display = 'none';
      }, 3000);
    }
  
    function copyToClipboard() {
      const policyText = policyPreview.textContent;
      navigator.clipboard.writeText(policyText).then(() => {
        showMessage('Policy copied to clipboard!', 'success');
      }).catch(() => {
        showMessage('Failed to copy. Please try again.', 'error');
      });
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
  });
  