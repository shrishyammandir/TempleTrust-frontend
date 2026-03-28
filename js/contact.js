// ========== Contact Page JavaScript ==========

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateContactForm()) {
                return;
            }
            
            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                subject: document.getElementById('subject').value.trim(),
                message: document.getElementById('message').value.trim()
            };
            
            try {
                AppUtils.showLoading();
                
                const response = await AppUtils.API.post('/api/contact/submit', formData);
                
                AppUtils.hideLoading();
                
                if (response.success) {
                    AppUtils.showToast('Thank you! Your message has been sent successfully.', 'success');
                    contactForm.reset();
                } else {
                    AppUtils.showToast('Failed to send message. Please try again.', 'error');
                }
                
            } catch (error) {
                AppUtils.hideLoading();
                AppUtils.showToast(error.message || 'Failed to send message', 'error');
            }
        });
    }
});

function validateContactForm() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    
    if (!name) {
        AppUtils.showToast('Please enter your name', 'error');
        return false;
    }
    
    if (!email || !AppUtils.validateEmail(email)) {
        AppUtils.showToast('Please enter a valid email address', 'error');
        return false;
    }
    
    if (!message) {
        AppUtils.showToast('Please enter your message', 'error');
        return false;
    }
    
    return true;
}
