// client.js

// --- Core Data & DOM Elements ---
const loginContainer = document.getElementById('login-container');
const dashboard = document.getElementById('dashboard');
const welcomeMessage = document.getElementById('welcome-message');
const stockListBody = document.getElementById('stock-list');

// Stores the last known price for dynamic color-coding (up/down flash)
const lastPrices = {};

// --- Portfolio State Management ---
const INITIAL_CAPITAL = 200000;
let portfolioState = {
    cash: INITIAL_CAPITAL,
    holdings: {} // Format: { 'GOOG': { quantity: 1, currentPrice: 1500 } }
};

// --- Simulation Data (Moved from Server) ---
const SUPPORTED_STOCKS = ['GOOG', 'TSLA', 'AMZN', 'META', 'NVDA'];

const BASE_PRICES = {
    'GOOG': 1500.00,
    'TSLA': 800.00,
    'AMZN': 3200.00,
    'META': 300.00,
    'NVDA': 600.00
};

// Current simulated prices
let currentPrices = { ...BASE_PRICES };

// User Subscriptions (loaded from LocalStorage)
let userSubscriptions = [];
let currentUserEmail = null;

// --- Initialization ---

// Check if user is already logged in
function checkLogin() {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
        currentUserEmail = savedEmail;
        // Load subscriptions
        const savedSubs = localStorage.getItem(`subscriptions_${currentUserEmail}`);
        if (savedSubs) {
            userSubscriptions = JSON.parse(savedSubs);
        }
        showDashboard(currentUserEmail);
    } else {
        document.body.classList.add('login-mode');
    }
}

// Start simulation loop on load
setInterval(simulateMarket, 1000);
checkLogin();


// --- Simulation Logic ---

/**
 * Generates a slight random change to the current price.
 */
function getRandomPriceChange(currentPrice) {
    const change = (Math.random() - 0.5) * 2;
    return Math.max(1, currentPrice + change);
}

/**
 * Simulates market updates and refreshes the UI
 */
function simulateMarket() {
    // 1. Update prices for ALL supported stocks (in background)
    SUPPORTED_STOCKS.forEach(ticker => {
        currentPrices[ticker] = getRandomPriceChange(currentPrices[ticker]);
    });

    // 2. If user is logged in, update their view
    if (currentUserEmail) {
        // Update Portfolio Holdings Prices
        Object.keys(portfolioState.holdings).forEach(ticker => {
            // Sync holding price with market price
            if (currentPrices[ticker]) {
                portfolioState.holdings[ticker].currentPrice = currentPrices[ticker];

                // Calculate change from base
                const basePrice = BASE_PRICES[ticker];
                const change = ((currentPrices[ticker] - basePrice) / basePrice) * 100;
                portfolioState.holdings[ticker].change = change;
            }
        });

        // Update Dashboard Lists
        userSubscriptions.forEach(ticker => {
            const newPrice = currentPrices[ticker];
            const basePrice = BASE_PRICES[ticker];
            const percentageChange = ((newPrice - basePrice) / basePrice) * 100;

            updateStockRow(ticker, newPrice, percentageChange);
        });

        updateDashboardStats();
    }
}


/**
 * Updates a single stock row in the UI
 */
function updateStockRow(ticker, newPrice, percentageChange) {
    const priceCell = document.getElementById(`price-${ticker}`);
    const changeCell = document.getElementById(`change-${ticker}`);

    if (priceCell && changeCell) {
        const previousPrice = lastPrices[ticker] || newPrice;

        // 1. Price Cell Update
        priceCell.classList.remove('price-up', 'price-down');
        if (newPrice > previousPrice) {
            priceCell.classList.add('price-up');
        } else if (newPrice < previousPrice) {
            priceCell.classList.add('price-down');
        }

        priceCell.textContent = `$${newPrice.toFixed(2)}`;
        lastPrices[ticker] = newPrice;

        // 2. Percentage Change Cell Update
        changeCell.classList.remove('price-up', 'price-down');
        let changeText = `${percentageChange.toFixed(2)}%`;

        if (percentageChange > 0) {
            changeCell.classList.add('price-up');
            changeText = `+${changeText}`;
        } else if (percentageChange < 0) {
            changeCell.classList.add('price-down');
        }

        changeCell.textContent = changeText;

        // 3. Remove Flash
        setTimeout(() => {
            priceCell.classList.remove('price-up', 'price-down');
        }, 500);
    }
}


// --- User Actions ---

function login() {
    const email = document.getElementById('email-input').value;
    if (email.includes('@') && email.length > 5) {
        currentUserEmail = email;
        localStorage.setItem('userEmail', email);

        // Load or Init Subscriptions
        const savedSubs = localStorage.getItem(`subscriptions_${email}`);
        if (savedSubs) {
            userSubscriptions = JSON.parse(savedSubs);
        } else {
            userSubscriptions = [];
        }

        showDashboard(email);
    } else {
        alert('Please enter a valid email address.');
    }
}

function showDashboard(email) {
    welcomeMessage.textContent = `Welcome, ${email}!`;
    loginContainer.style.display = 'none';
    dashboard.style.display = 'block';

    // Clear list and re-populate
    stockListBody.innerHTML = '';
    userSubscriptions.forEach(addStockRow);

    document.body.classList.remove('login-mode');
}

function subscribeStock() {
    const tickerInput = document.getElementById('ticker-input');
    const ticker = tickerInput.value.toUpperCase().trim();

    if (ticker) {
        if (SUPPORTED_STOCKS.includes(ticker)) {
            if (!userSubscriptions.includes(ticker)) {

                // Add to State
                userSubscriptions.push(ticker);

                // Save to Persistence
                localStorage.setItem(`subscriptions_${currentUserEmail}`, JSON.stringify(userSubscriptions));

                // Update UI
                addStockRow(ticker);

                // Initialize holding entry if not exists (simulate buying 1 unit for portfolio calc)
                if (!portfolioState.holdings[ticker]) {
                    portfolioState.holdings[ticker] = {
                        quantity: 1,
                        currentPrice: currentPrices[ticker],
                        change: 0
                    };
                }

                alert(`Subscribed to ${ticker}`);
            } else {
                alert('You are already subscribed to this stock.');
            }
        } else {
            alert('Stock not supported. Try GOOG, TSLA, AMZN, META, or NVDA.');
        }
        tickerInput.value = '';
    }
}

function logout() {
    currentUserEmail = null;
    userSubscriptions = [];
    localStorage.removeItem('userEmail');

    document.getElementById('email-input').value = '';
    document.getElementById('welcome-message').textContent = 'Dashboard';

    document.querySelectorAll('.view-container').forEach(el => el.style.display = 'none');
    document.getElementById('login-container').style.display = 'flex';
    document.body.classList.add('login-mode');
}


// --- UI Utilities ---

function unsubscribeStock(ticker) {
    if (confirm(`Are you sure you want to remove ${ticker} from your watchlist?`)) {
        // 1. Remove from local state
        userSubscriptions = userSubscriptions.filter(t => t !== ticker);

        // 2. Update Persistence
        localStorage.setItem(`subscriptions_${currentUserEmail}`, JSON.stringify(userSubscriptions));

        // 3. Remove DOM element
        const row = document.getElementById(`row-${ticker}`);
        if (row) row.remove();

        // 4. Update Stats (simulate selling/removing holding)
        delete portfolioState.holdings[ticker];
        updateDashboardStats();
    }
}

function addStockRow(ticker) {
    if (document.getElementById(`row-${ticker}`)) return;

    const row = stockListBody.insertRow();
    row.id = `row-${ticker}`;

    // Ticker
    const tickerCell = row.insertCell(0);
    tickerCell.textContent = ticker;

    // Price
    const priceCell = row.insertCell(1);
    priceCell.id = `price-${ticker}`;
    priceCell.classList.add('price-cell');
    priceCell.textContent = '$N/A';

    // Change
    const changeCell = row.insertCell(2);
    changeCell.id = `change-${ticker}`;
    changeCell.classList.add('price-cell');
    changeCell.textContent = '0.00%';

    // Action (Unsubscribe)
    const actionCell = row.insertCell(3);
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×'; // or 'Remove'
    removeBtn.className = 'btn-danger-small';
    removeBtn.title = 'Remove Stock';
    removeBtn.onclick = () => unsubscribeStock(ticker);
    actionCell.appendChild(removeBtn);
}

/**
 * Updates the dashboard stats based on current portfolio state.
 */
function updateDashboardStats() {
    let totalPortfolioValue = 0;
    let totalDayStartValue = 0;

    // Calculate value of holdings
    for (const [ticker, data] of Object.entries(portfolioState.holdings)) {
        // If user is subscribed, count it in portfolio (virtual portfolio logic)
        if (userSubscriptions.includes(ticker)) {
            const value = data.quantity * data.currentPrice;
            totalPortfolioValue += value;

            const dayStartPrice = data.currentPrice / (1 + (data.change / 100));
            totalDayStartValue += data.quantity * dayStartPrice;
        }
    }

    // Add leftover cash? For now just equity value + cash
    // totalPortfolioValue += portfolioState.cash; // (Optional: depending on if we want to show total net worth or just positions)

    const currentDayGain = totalPortfolioValue - totalDayStartValue;
    const currentDayGainPercent = totalDayStartValue > 0 ? (currentDayGain / totalDayStartValue) * 100 : 0;
    const buyingPower = portfolioState.cash - (totalPortfolioValue); // Simplistic buying power logic

    // Update UI
    const portValueEl = document.getElementById('portfolio-value');
    if (portValueEl) portValueEl.textContent = `$${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const buyingPowerEl = document.getElementById('buying-power');
    if (buyingPowerEl) buyingPowerEl.textContent = `$${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const dayGainEl = document.getElementById('day-gain');
    const dayGainPercentEl = document.getElementById('day-gain-percent');

    if (dayGainEl && dayGainPercentEl) {
        dayGainEl.textContent = `$${currentDayGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        dayGainPercentEl.textContent = `${currentDayGainPercent >= 0 ? '+' : ''}${currentDayGainPercent.toFixed(2)}%`;

        dayGainEl.className = `value ${currentDayGain >= 0 ? 'text-success' : 'text-danger'}`;
        dayGainPercentEl.className = `change ${currentDayGain >= 0 ? 'positive' : 'negative'}`;

        if (currentDayGain >= 0) {
            dayGainPercentEl.style.color = 'var(--success)';
            dayGainEl.style.color = 'var(--success)';
        } else {
            dayGainPercentEl.style.color = 'var(--danger)';
            dayGainEl.style.color = 'var(--danger)';
        }
    }
}

// --- View Navigation & Settings ---

function showSection(sectionId, navElement) {
    document.querySelectorAll('.view-container').forEach(el => el.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';

    if (navElement) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navElement.classList.add('active');
    }
}

function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('theme-toggle');
    body.classList.toggle('light-mode');

    if (body.classList.contains('light-mode')) {
        btn.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    } else {
        btn.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    }
}

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = '☀️';
}

function saveProfile() {
    const name = document.getElementById('profile-name').value;
    alert(`Profile updated for ${name}!`);
}


// --- Responsive JS ---
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Close sidebar when clicking outside (optional enhancement)
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.mobile-toggle');

    // If sidebar is open, click is OUTSIDE sidebar, and NOT on the toggle button
    if (sidebar.classList.contains('active') &&
        !sidebar.contains(e.target) &&
        !toggle.contains(e.target)) {
        sidebar.classList.remove('active');
    }
});

// Close sidebar on nav item click (Mobile)
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar').classList.remove('active');
        }
    });
});

