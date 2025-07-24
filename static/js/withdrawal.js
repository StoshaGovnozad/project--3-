// Withdrawal page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (localStorage.getItem('isAuthenticated') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize withdrawal page
    initializeWithdrawal();
    
    function initializeWithdrawal() {
        setupMethodSelection();
        setupAmountInput();
        setupQuickAmounts();
        setupFormValidation();
        loadRecentWithdrawals();
        setupFormSubmission();
    }
    
    // Method selection functionality
    function setupMethodSelection() {
        const methodCards = document.querySelectorAll('.method-card');
        const methodDetails = document.getElementById('methodDetails');
        const methodForms = document.querySelectorAll('.method-form');
        
        methodCards.forEach(card => {
            card.addEventListener('click', function() {
                const method = this.getAttribute('data-method');
                
                // Remove selected class from all cards
                methodCards.forEach(c => c.classList.remove('selected'));
                
                // Add selected class to clicked card
                this.classList.add('selected');
                
                // Hide all method forms
                methodForms.forEach(form => form.style.display = 'none');
                
                // Show selected method form
                const selectedForm = document.getElementById(method + 'Form');
                if (selectedForm) {
                    selectedForm.style.display = 'block';
                    methodDetails.style.display = 'block';
                }
                
                // Update fee calculation
                calculateFees();
                validateForm();
            });
        });
    }
    
    // Amount input functionality
    function setupAmountInput() {
        const amountInput = document.getElementById('withdrawalAmount');
        
        amountInput.addEventListener('input', function() {
            // Format number with spaces
            let value = this.value.replace(/\s/g, '');
            if (value) {
                this.value = parseInt(value).toLocaleString('ru-RU');
            }
            
            calculateFees();
            validateForm();
        });
        
        amountInput.addEventListener('blur', function() {
            // Remove formatting for calculation
            let value = this.value.replace(/\s/g, '');
            this.setAttribute('data-value', value);
        });
    }
    
    // Quick amount buttons
    function setupQuickAmounts() {
        const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
        const amountInput = document.getElementById('withdrawalAmount');
        
        quickAmountBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                
                // Remove active class from all buttons
                quickAmountBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Set amount
                amountInput.value = parseInt(amount).toLocaleString('ru-RU');
                amountInput.setAttribute('data-value', amount);
                
                calculateFees();
                validateForm();
            });
        });
    }
    
    // Fee calculation
    function calculateFees() {
        const amountInput = document.getElementById('withdrawalAmount');
        const selectedMethod = document.querySelector('.method-card.selected');
        const feeInfo = document.getElementById('feeInfo');
        
        if (!selectedMethod || !amountInput.value) {
            feeInfo.style.display = 'none';
            return;
        }
        
        const amount = parseInt(amountInput.value.replace(/\s/g, '')) || 0;
        const method = selectedMethod.getAttribute('data-method');
        
        let feePercent = 0;
        let fixedFee = 0;
        
        // Fee calculation based on method
        switch (method) {
            case 'sbp':
                feePercent = 0;
                fixedFee = 0;
                break;
            case 'card':
                feePercent = 1.5;
                fixedFee = 0;
                break;
            case 'crypto':
                feePercent = 0;
                fixedFee = 500; // Network fee simulation
                break;
            case 'bank':
                feePercent = 2;
                fixedFee = 100;
                break;
        }
        
        const percentFee = Math.round(amount * feePercent / 100);
        const totalFee = percentFee + fixedFee;
        const totalAmount = amount + totalFee;
        
        // Update fee display
        document.getElementById('withdrawalAmountDisplay').textContent = 
            '₽' + amount.toLocaleString('ru-RU');
        document.getElementById('feeAmount').textContent = 
            '₽' + totalFee.toLocaleString('ru-RU');
        document.getElementById('totalAmount').textContent = 
            '₽' + totalAmount.toLocaleString('ru-RU');
        
        feeInfo.style.display = 'block';
    }
    
    // Form validation
    function setupFormValidation() {
        const form = document.getElementById('withdrawalForm');
        const inputs = form.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            input.addEventListener('input', validateForm);
            input.addEventListener('blur', validateForm);
        });
    }
    
    function validateForm() {
        const amountInput = document.getElementById('withdrawalAmount');
        const selectedMethod = document.querySelector('.method-card.selected');
        const submitBtn = document.getElementById('submitBtn');
        
        let isValid = true;
        
        // Check amount
        const amount = parseInt(amountInput.value.replace(/\s/g, '')) || 0;
        if (amount < 100 || amount > 2450000) {
            isValid = false;
        }
        
        // Check method selection
        if (!selectedMethod) {
            isValid = false;
        }
        
        // Check method-specific fields
        if (selectedMethod) {
            const method = selectedMethod.getAttribute('data-method');
            const methodForm = document.getElementById(method + 'Form');
            
            if (methodForm) {
                const requiredInputs = methodForm.querySelectorAll('input[required], select[required]');
                requiredInputs.forEach(input => {
                    if (!input.value.trim()) {
                        isValid = false;
                    }
                });
                
                // Additional validation based on method
                switch (method) {
                    case 'sbp':
                        const phone = document.getElementById('sbpPhone').value;
                        if (phone && !isValidPhone(phone)) {
                            isValid = false;
                        }
                        break;
                    case 'card':
                        const cardNumber = document.getElementById('cardNumber').value;
                        if (cardNumber && !isValidCardNumber(cardNumber)) {
                            isValid = false;
                        }
                        break;
                    case 'crypto':
                        const cryptoAddress = document.getElementById('cryptoAddress').value;
                        const cryptoCurrency = document.getElementById('cryptoCurrency').value;
                        if (!cryptoCurrency || (cryptoAddress && !isValidCryptoAddress(cryptoAddress, cryptoCurrency))) {
                            isValid = false;
                        }
                        break;
                    case 'bank':
                        const bankAccount = document.getElementById('bankAccount').value;
                        const bankBik = document.getElementById('bankBik').value;
                        if ((bankAccount && !isValidBankAccount(bankAccount)) || 
                            (bankBik && !isValidBik(bankBik))) {
                            isValid = false;
                        }
                        break;
                }
            }
        }
        
        submitBtn.disabled = !isValid;
    }
    
    // Validation helpers
    function isValidPhone(phone) {
        const phoneRegex = /^\+?[7-8][\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    
    function isValidCardNumber(cardNumber) {
        const cleaned = cardNumber.replace(/\s/g, '');
        return cleaned.length >= 13 && cleaned.length <= 19 && /^\d+$/.test(cleaned);
    }
    
    function isValidCryptoAddress(address, currency) {
        // Simplified validation
        switch (currency) {
            case 'BTC':
                return address.length >= 26 && address.length <= 35;
            case 'ETH':
            case 'USDT':
            case 'USDC':
                return address.length === 42 && address.startsWith('0x');
            default:
                return address.length > 20;
        }
    }
    
    function isValidBankAccount(account) {
        return account.length === 20 && /^\d+$/.test(account);
    }
    
    function isValidBik(bik) {
        return bik.length === 9 && /^\d+$/.test(bik);
    }
    
    // Form submission
    function setupFormSubmission() {
        const form = document.getElementById('withdrawalForm');
        const submitBtn = document.getElementById('submitBtn');
        const submitSpinner = document.getElementById('submitSpinner');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (submitBtn.disabled) return;
            
            // Start loading
            submitBtn.disabled = true;
            submitBtn.querySelector('span').style.opacity = '0.7';
            submitSpinner.style.display = 'inline-block';
            
            // Collect form data
            const formData = collectFormData();
            
            // Simulate API call
            setTimeout(() => {
                processWithdrawal(formData);
            }, 2000);
        });
    }
    
    function collectFormData() {
        const amountInput = document.getElementById('withdrawalAmount');
        const selectedMethod = document.querySelector('.method-card.selected');
        
        const amount = parseInt(amountInput.value.replace(/\s/g, ''));
        const method = selectedMethod.getAttribute('data-method');
        
        const data = {
            amount: amount,
            method: method,
            timestamp: new Date().toISOString()
        };
        
        // Add method-specific data
        switch (method) {
            case 'sbp':
                data.phone = document.getElementById('sbpPhone').value;
                break;
            case 'card':
                data.cardNumber = document.getElementById('cardNumber').value;
                data.cardHolder = document.getElementById('cardHolder').value;
                break;
            case 'crypto':
                data.currency = document.getElementById('cryptoCurrency').value;
                data.address = document.getElementById('cryptoAddress').value;
                break;
            case 'bank':
                data.account = document.getElementById('bankAccount').value;
                data.bik = document.getElementById('bankBik').value;
                data.bankName = document.getElementById('bankName').value;
                break;
        }
        
        return data;
    }
    
    function processWithdrawal(data) {
        const submitBtn = document.getElementById('submitBtn');
        const submitSpinner = document.getElementById('submitSpinner');
        
        // Simulate successful processing
        showNotification('Заявка на вывод успешно создана!', 'success');
        
        // Reset form
        document.getElementById('withdrawalForm').reset();
        document.querySelectorAll('.method-card').forEach(card => card.classList.remove('selected'));
        document.querySelectorAll('.quick-amount-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('methodDetails').style.display = 'none';
        document.getElementById('feeInfo').style.display = 'none';
        
        // Stop loading
        submitBtn.disabled = true;
        submitBtn.querySelector('span').style.opacity = '1';
        submitSpinner.style.display = 'none';
        
        // Add to recent withdrawals
        addToRecentWithdrawals(data);
        
        // Redirect to dashboard after delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
    }
    
    // Load recent withdrawals
    function loadRecentWithdrawals() {
        const withdrawalsList = document.getElementById('recentWithdrawals');
        
        const withdrawals = [
            {
                id: 1,
                method: 'sbp',
                title: 'Вывод СБП',
                description: 'На номер +7 (999) 123-45-67',
                amount: '₽25,000',
                status: 'completed',
                time: '2 часа назад'
            },
            {
                id: 2,
                method: 'crypto',
                title: 'Вывод BTC',
                description: 'На адрес 1A1zP1eP...DivfNa',
                amount: '₽150,000',
                status: 'processing',
                time: '1 день назад'
            },
            {
                id: 3,
                method: 'card',
                title: 'Вывод на карту',
                description: 'Visa ****1234',
                amount: '₽50,000',
                status: 'completed',
                time: '3 дня назад'
            }
        ];
        
        withdrawalsList.innerHTML = withdrawals.map(withdrawal => `
            <div class="withdrawal-item">
                <div class="withdrawal-info">
                    <div class="withdrawal-icon ${withdrawal.method}">
                        <i class="fas ${getMethodIcon(withdrawal.method)}"></i>
                    </div>
                    <div class="withdrawal-details">
                        <h4>${withdrawal.title}</h4>
                        <p>${withdrawal.description}</p>
                    </div>
                </div>
                <div class="withdrawal-amount">
                    <div class="amount">-${withdrawal.amount}</div>
                    <div class="status ${withdrawal.status}">${getStatusText(withdrawal.status)}</div>
                </div>
            </div>
        `).join('');
    }
    
    function getMethodIcon(method) {
        const icons = {
            'sbp': 'fa-mobile-alt',
            'card': 'fa-credit-card',
            'crypto': 'fa-bitcoin',
            'bank': 'fa-university'
        };
        return icons[method] || 'fa-arrow-up';
    }
    
    function getStatusText(status) {
        const statusMap = {
            'completed': 'Завершено',
            'processing': 'В обработке',
            'pending': 'Ожидание',
            'failed': 'Отклонено'
        };
        return statusMap[status] || status;
    }
    
    function addToRecentWithdrawals(data) {
        // This would normally update the backend
        // For now, just show in notification
        console.log('New withdrawal added:', data);
    }
    
    // Logout functionality
    window.logout = function() {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('loginTime');
        
        showNotification('Вы успешно вышли из системы', 'info');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    };
    
    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
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
    
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
            let value = this.value.replace(/\s/g, '');
            let formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
            if (formattedValue.length > 19) {
                formattedValue = formattedValue.substring(0, 19);
            }
            this.value = formattedValue;
        });
    }
    
    // Phone number formatting
    const phoneInput = document.getElementById('sbpPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.startsWith('8')) {
                value = '7' + value.substring(1);
            }
            if (value.startsWith('7')) {
                value = value.substring(0, 11);
                this.value = '+7 (' + value.substring(1, 4) + ') ' + 
                           value.substring(4, 7) + '-' + 
                           value.substring(7, 9) + '-' + 
                           value.substring(9, 11);
            }
        });
    }
});