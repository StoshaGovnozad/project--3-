// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (localStorage.getItem('isAuthenticated') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize dashboard
    initializeDashboard();
    
    function initializeDashboard() {
        setupPeriodSelector();
        setupBalanceToggle();
        setupChart();
        loadTransactions();
        updateStats();
    }
    
    // Period selector functionality
    function setupPeriodSelector() {
        const periodBtns = document.querySelectorAll('.period-btn');
        
        periodBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                periodBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Update data based on selected period
                const period = this.getAttribute('data-period');
                updateDashboardData(period);
            });
        });
    }
    
    // Balance toggle functionality
    function setupBalanceToggle() {
        const balanceToggle = document.getElementById('balanceToggle');
        const balanceValue = document.getElementById('balanceValue');
        const balanceIcon = document.getElementById('balanceIcon');
        let isHidden = false;
        
        balanceToggle.addEventListener('click', function() {
            if (isHidden) {
                balanceValue.textContent = '₽2,450,000';
                balanceIcon.className = 'fas fa-eye';
                isHidden = false;
            } else {
                balanceValue.textContent = '₽***,***';
                balanceIcon.className = 'fas fa-eye-slash';
                isHidden = true;
            }
        });
    }
    
    // Chart setup
    function setupChart() {
        const ctx = document.getElementById('paymentsChart').getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(249, 115, 22, 0.3)');
        gradient.addColorStop(1, 'rgba(249, 115, 22, 0.05)');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
                datasets: [{
                    label: 'Платежи',
                    data: [120000, 190000, 300000, 500000, 200000, 300000, 450000, 600000, 750000, 900000, 1100000, 1300000],
                    borderColor: '#f97316',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#f97316',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#334155',
                            borderColor: '#334155'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        grid: {
                            color: '#334155',
                            borderColor: '#334155'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return '₽' + (value / 1000) + 'K';
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#f97316'
                    }
                }
            }
        });
    }
    
    // Load transactions
    function loadTransactions() {
        const transactionsList = document.getElementById('transactionsList');
        
        const transactions = [
            {
                id: 1,
                type: 'income',
                title: 'Пополнение СБП',
                description: 'От: Иван И.',
                amount: '+₽25,000',
                status: 'completed',
                time: '2 мин назад'
            },
            {
                id: 2,
                type: 'outcome',
                title: 'Вывод BTC',
                description: 'На: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                amount: '-₽150,000',
                status: 'pending',
                time: '15 мин назад'
            },
            {
                id: 3,
                type: 'income',
                title: 'Платёж USDT',
                description: 'От: Компания ООО',
                amount: '+₽75,500',
                status: 'completed',
                time: '1 час назад'
            },
            {
                id: 4,
                type: 'outcome',
                title: 'Комиссия системы',
                description: 'За обработку платежей',
                amount: '-₽2,250',
                status: 'completed',
                time: '2 часа назад'
            },
            {
                id: 5,
                type: 'income',
                title: 'Пополнение картой',
                description: 'Visa ****1234',
                amount: '+₽50,000',
                status: 'completed',
                time: '3 часа назад'
            }
        ];
        
        transactionsList.innerHTML = transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-icon ${transaction.type}">
                        <i class="fas ${transaction.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.title}</h4>
                        <p>${transaction.description}</p>
                    </div>
                </div>
                <div class="transaction-amount">
                    <div class="amount ${transaction.type === 'income' ? 'positive' : 'negative'}">
                        ${transaction.amount}
                    </div>
                    <div class="status ${transaction.status}">${getStatusText(transaction.status)}</div>
                </div>
            </div>
        `).join('');
    }
    
    function getStatusText(status) {
        const statusMap = {
            'completed': 'Завершено',
            'pending': 'В обработке',
            'failed': 'Отклонено'
        };
        return statusMap[status] || status;
    }
    
    // Update dashboard data based on period
    function updateDashboardData(period) {
        // Simulate data update
        const periodData = {
            '24h': {
                balance: '₽2,450,000',
                transactions: '1,247',
                clients: '89',
                conversion: '94.2%',
                changes: ['+12.5%', '+8.2%', '+15.3%', '+2.1%']
            },
            '7d': {
                balance: '₽18,750,000',
                transactions: '8,934',
                clients: '456',
                conversion: '92.8%',
                changes: ['+18.7%', '+12.4%', '+22.1%', '+4.3%']
            },
            '30d': {
                balance: '₽75,200,000',
                transactions: '34,567',
                clients: '1,234',
                conversion: '91.5%',
                changes: ['+25.3%', '+19.8%', '+28.9%', '+6.7%']
            },
            '90d': {
                balance: '₽198,500,000',
                transactions: '98,765',
                clients: '3,456',
                conversion: '89.7%',
                changes: ['+32.1%', '+24.6%', '+35.4%', '+8.9%']
            },
            '1y': {
                balance: '₽850,000,000',
                transactions: '456,789',
                clients: '12,345',
                conversion: '87.3%',
                changes: ['+45.8%', '+38.2%', '+52.7%', '+12.4%']
            }
        };
        
        const data = periodData[period];
        if (data) {
            // Update balance if not hidden
            const balanceValue = document.getElementById('balanceValue');
            const balanceIcon = document.getElementById('balanceIcon');
            if (balanceIcon.classList.contains('fa-eye')) {
                balanceValue.textContent = data.balance;
            }
            
            // Update other stats
            const statValues = document.querySelectorAll('.stat-value');
            const statChanges = document.querySelectorAll('.stat-change');
            
            if (statValues.length >= 4) {
                statValues[1].textContent = data.transactions;
                statValues[2].textContent = data.clients;
                statValues[3].textContent = data.conversion;
            }
            
            statChanges.forEach((change, index) => {
                if (data.changes[index]) {
                    change.textContent = data.changes[index];
                }
            });
        }
    }
    
    // Update stats with animation
    function updateStats() {
        const statCards = document.querySelectorAll('.stat-card');
        
        statCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-fade-in');
        });
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
    
    // Real-time updates simulation
    setInterval(() => {
        // Simulate real-time transaction updates
        const transactionsList = document.getElementById('transactionsList');
        const firstTransaction = transactionsList.querySelector('.transaction-item');
        
        if (firstTransaction && Math.random() > 0.7) {
            firstTransaction.style.background = 'rgba(16, 185, 129, 0.1)';
            setTimeout(() => {
                firstTransaction.style.background = '';
            }, 2000);
        }
    }, 5000);
});