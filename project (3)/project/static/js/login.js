// Login page functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const telegramBtn = document.getElementById('telegramBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emailInput = document.getElementById('email');
    
    // Form submission handler
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        if (!email) {
            showNotification('Пожалуйста, введите email адрес', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Пожалуйста, введите корректный email адрес', 'error');
            return;
        }
        
        // Start loading
        startLoading();
        
        // Simulate Telegram authentication
        simulateTelegramAuth(email);
    });
    
    function startLoading() {
        telegramBtn.disabled = true;
        telegramBtn.querySelector('span').style.opacity = '0.7';
        loadingSpinner.style.display = 'block';
    }
    
    function stopLoading() {
        telegramBtn.disabled = false;
        telegramBtn.querySelector('span').style.opacity = '1';
        loadingSpinner.style.display = 'none';
    }
    
    function simulateTelegramAuth(email) {
        // Simulate API call delay
        setTimeout(() => {
            // Store user data
            localStorage.setItem('userEmail', email);
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('loginTime', new Date().toISOString());
            
            showNotification('Успешная авторизация! Перенаправление...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        }, 2000);
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Add notification styles
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 300px;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            background: linear-gradient(135deg, #10b981, #34d399);
        }
        
        .notification.error {
            background: linear-gradient(135deg, #ef4444, #f87171);
        }
        
        .notification.info {
            background: linear-gradient(135deg, #3b82f6, #06b6d4);
        }
    `;
    document.head.appendChild(notificationStyles);
    
    // Input focus effects
    emailInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    emailInput.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
    
    // Add focus styles
    const focusStyles = document.createElement('style');
    focusStyles.textContent = `
        .form-group.focused .form-label {
            color: #f97316;
            transform: translateY(-2px);
        }
        
        .form-group {
            position: relative;
        }
        
        .form-label {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(focusStyles);
    
    // Floating elements animation
    const floatingElements = document.querySelectorAll('.floating-element');
    floatingElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.5}s`;
    });
    
    // Background particles
    function createLoginParticle() {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '3px';
        particle.style.height = '3px';
        particle.style.background = '#f97316';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = '100%';
        particle.style.opacity = '0.6';
        particle.style.pointerEvents = 'none';
        particle.style.animation = 'float-up 4s linear infinite';
        
        const loginBg = document.querySelector('.login-bg');
        if (loginBg) {
            loginBg.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 4000);
        }
    }
    
    // Create particles periodically
    setInterval(createLoginParticle, 1500);
    
    // Check if user is already authenticated
    if (localStorage.getItem('isAuthenticated') === 'true') {
        showNotification('Вы уже авторизованы. Перенаправление...', 'info');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }
});