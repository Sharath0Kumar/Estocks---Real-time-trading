// client.js
// Connect to the Socket.IO server running on port 3000
const socket = io('http://localhost:3000');

// --- Core Data & DOM Elements ---
const loginContainer = document.getElementById('login-container');
const dashboard = document.getElementById('dashboard');
const welcomeMessage = document.getElementById('welcome-message');
const stockListBody = document.getElementById('stock-list');

// Stores the last known price for dynamic color-coding (up/down flash)
const lastPrices = {};

// --- Portfolio State Management ---
const INITIAL_CAPITAL = 200000;
const portfolioState = {
    cash: INITIAL_CAPITAL,
    holdings: {} // Format: { 'GOOG': { quantity: 1, currentPrice: 1500 } }
};

/**
 * Updates the dashboard stats based on current portfolio state.
 */
function updateDashboardStats() {
    let totalPortfolioValue = 0;
    let totalDayStartValue = 0;

    // Calculate value of holdings
    for (const [ticker, data] of Object.entries(portfolioState.holdings)) {
        const value = data.quantity * data.currentPrice;
        totalPortfolioValue += value;

        // Calculate what the value was at the start of the day
        // Formula: current / (1 + change/100)
        const dayStartPrice = data.currentPrice / (1 + (data.change / 100));
        totalDayStartValue += data.quantity * dayStartPrice;
    }

    const currentDayGain = totalPortfolioValue - totalDayStartValue;
    const currentDayGainPercent = totalDayStartValue > 0 ? (currentDayGain / totalDayStartValue) * 100 : 0;
    const buyingPower = portfolioState.cash - totalPortfolioValue;

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

        // Color coding
        dayGainEl.className = `value ${currentDayGain >= 0 ? 'text-success' : 'text-danger'}`;
        dayGainPercentEl.className = `change ${currentDayGain >= 0 ? 'positive' : 'negative'}`;

        // Add dynamic colors to styles if not present
        if (currentDayGain >= 0) {
            dayGainPercentEl.style.color = 'var(--success)';
            dayGainEl.style.color = 'var(--success)';
        } else {
            dayGainPercentEl.style.color = 'var(--danger)';
            dayGainEl.style.color = 'var(--danger)';
        }
    }
}


// --- User Actions ---

/**
 * 0) Handles user login and sends the email to the server.
 */
function login() {
    const email = document.getElementById('email-input').value;
    if (email.includes('@') && email.length > 5) {
        // 1. Send login event to the server
        socket.emit('login', email);

        // 2. Update UI
        welcomeMessage.textContent = `Welcome, ${email}!`;
        loginContainer.style.display = 'none';
        dashboard.style.display = 'block';

        // Remove login-mode class to show nav
        document.body.classList.remove('login-mode');
    } else {
        alert('Please enter a valid email address.');
    }
}

/**
 * 1) Subscribes to a stock ticker.
 */
function subscribeStock() {
    const tickerInput = document.getElementById('ticker-input');
    const ticker = tickerInput.value.toUpperCase().trim();

    if (ticker) {
        // Send subscription request to the server
        socket.emit('subscribe_stock', ticker);
        tickerInput.value = ''; // Clear input
    }
}

// --- WebSocket Event Listeners ---

/**
 * Receives the initial list of subscriptions after login.
 */
socket.on('initial_subscriptions', (tickers) => {
    tickers.forEach(addStockRow);
});

/**
 * Confirms a successful new subscription from the server and adds the row.
 */
socket.on('subscription_success', (ticker) => {
    addStockRow(ticker);
    console.log(`Successfully subscribed to ${ticker}`);
});

/**
 * 2) & 3) Receives real-time stock updates from the server.
 */
socket.on('stock_update', (data) => {
    // data structure: { ticker: 'GOOG', price: '123.45', change: '0.75' }
    const ticker = data.ticker;
    const newPrice = parseFloat(data.price);
    const percentageChange = parseFloat(data.change);

    // Update Portfolio State
    if (!portfolioState.holdings[ticker]) {
        portfolioState.holdings[ticker] = { quantity: 1, currentPrice: newPrice, change: percentageChange };
    } else {
        portfolioState.holdings[ticker].currentPrice = newPrice;
        portfolioState.holdings[ticker].change = percentageChange;
    }

    updateDashboardStats(); // Recalculate totals

    const priceCell = document.getElementById(`price-${ticker}`);
    const changeCell = document.getElementById(`change-${ticker}`);

    if (priceCell && changeCell) {
        const previousPrice = lastPrices[ticker] || newPrice; // Get last price for comparison

        // --- 1. Price Cell Update ---
        priceCell.classList.remove('price-up', 'price-down');

        // Apply color flash based on the tick direction
        if (newPrice > previousPrice) {
            priceCell.classList.add('price-up');
        } else if (newPrice < previousPrice) {
            priceCell.classList.add('price-down');
        }

        priceCell.textContent = `$${data.price}`;
        lastPrices[ticker] = newPrice;

        // --- 2. Percentage Change Cell Update ---
        changeCell.classList.remove('price-up', 'price-down');
        let changeText = `${data.change}%`;

        // Apply color based on overall daily change
        if (percentageChange > 0) {
            changeCell.classList.add('price-up');
            changeText = `+${changeText}`; // Add a plus sign for positive change
        } else if (percentageChange < 0) {
            changeCell.classList.add('price-down');
        }

        changeCell.textContent = changeText;

        // --- 3. Remove Flash Effect ---
        // Clears the background color flash on the price cell after a short duration
        setTimeout(() => {
            priceCell.classList.remove('price-up', 'price-down');
        }, 500);
    }
});


// --- Utility Function ---

/**
 * Adds a new row for a stock ticker to the portfolio table.
 * @param {string} ticker - The stock symbol.
 */
function addStockRow(ticker) {
    // Prevent duplicate rows
    if (document.getElementById(`row-${ticker}`)) return;

    const row = stockListBody.insertRow();
    row.id = `row-${ticker}`;

    // 1. Ticker Cell
    const tickerCell = row.insertCell(0);
    tickerCell.textContent = ticker;

    // 2. Price Cell
    const priceCell = row.insertCell(1);
    priceCell.id = `price-${ticker}`;
    priceCell.classList.add('price-cell');
    priceCell.textContent = '$N/A'; // Initial value

    // 3. % Change Cell
    const changeCell = row.insertCell(2);
    changeCell.id = `change-${ticker}`;
    changeCell.classList.add('price-cell');
    changeCell.textContent = '0.00%'; // Initial value
}

// --- View Navigation & Settings ---

/**
 * Switch between views (Dashboard <-> Settings)
 */
function showSection(sectionId, navElement) {
    // 1. Hide all view containers
    document.querySelectorAll('.view-container').forEach(el => el.style.display = 'none');

    // 2. Show the selected view
    document.getElementById(sectionId).style.display = 'block';

    // 3. Update Sidebar active state
    if (navElement) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navElement.classList.add('active');
    }
}

/**
 * Toggle Dark/Light Theme
 */
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

// Initialize Theme on Load
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = '☀️';
}


/**
 * Handle Logout
 */
function logout() {
    // 1. Clear session data (local simulation)
    const email = document.getElementById('email-input');
    if (email) email.value = '';

    // 2. Reset UI
    document.getElementById('welcome-message').textContent = 'Dashboard';

    // 3. Navigate to Login
    document.querySelectorAll('.view-container').forEach(el => el.style.display = 'none');
    document.getElementById('login-container').style.display = 'flex'; // Flex for centering

    // Add login-mode class to hide nav
    document.body.classList.add('login-mode');
}


/**
 * Mock Profile Save
 */
function saveProfile() {
    const name = document.getElementById('profile-name').value;
    alert(`Profile updated for ${name}!`);
}

// Check login status on load
if (document.getElementById('login-container').style.display !== 'none') {
    document.body.classList.add('login-mode');
}
