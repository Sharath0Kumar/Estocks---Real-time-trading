// server.js

// 1. Dependencies
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// 2. Server Setup
const app = express();
const server = http.createServer(app);
const io = new Server(server); 
const PORT = 3000;

// Serve the static files (index.html, client.js, style.css) from the 'public' folder
app.use(express.static('public'));

// --- Core Data Structures ---

// Supported Tickers
const SUPPORTED_STOCKS = ['GOOG', 'TSLA', 'AMZN', 'META', 'NVDA'];

// Initial Prices (Open Price) for calculating % Change
const BASE_PRICES = {
    'GOOG': 1500.00,
    'TSLA': 800.00,
    'AMZN': 3200.00,
    'META': 300.00,
    'NVDA': 600.00
};

// Stores the CURRENT price for each stock (starts at BASE_PRICE)
const currentPrices = { ...BASE_PRICES };

// Stores user-specific subscriptions: { email: [subscribed_tickers] }
const userSubscriptions = {
    // Example data to test two users subscribing to different stocks:
    'alice@example.com': ['GOOG', 'TSLA'],
    'bob@example.com': ['AMZN', 'NVDA']
};

// Maps socket.id to user email for session tracking
const socketToUserMap = {};

// --- Utility Function ---

/**
 * Generates a slight random change to the current price.
 * @param {number} currentPrice - The last known price.
 * @returns {number} The new simulated price.
 */
function getRandomPriceChange(currentPrice) {
    // Random change between -1 and 1
    const change = (Math.random() - 0.5) * 2; 
    // New price, ensuring it doesn't drop below 1
    const newPrice = Math.max(1, currentPrice + change); 
    return newPrice;
}


// --- Socket.IO Connection Handler ---

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 0) Allows a user to login using his/her email
    socket.on('login', (userEmail) => {
        const email = userEmail.toLowerCase().trim();
        
        // Simulate successful login and session tracking
        socketToUserMap[socket.id] = email;
        
        // Ensure the user has an entry in the subscription list
        if (!userSubscriptions[email]) {
            userSubscriptions[email] = [];
        }

        // Send initial subscription list to the client
        const subscriptions = userSubscriptions[email];
        socket.emit('initial_subscriptions', subscriptions);
        console.log(`User ${email} logged in. Subscribed to: ${subscriptions.join(', ')}`);
    });

    // 1) Subscribe to a Supported Stock
    socket.on('subscribe_stock', (ticker) => {
        const email = socketToUserMap[socket.id];
        if (!email) return; 
        
        const validTicker = ticker.toUpperCase();
        
        if (SUPPORTED_STOCKS.includes(validTicker)) {
            // Add to the user's subscriptions if not already present
            if (!userSubscriptions[email].includes(validTicker)) {
                userSubscriptions[email].push(validTicker);
                
                // Confirm subscription to the specific client
                socket.emit('subscription_success', validTicker);
                console.log(`${email} subscribed to ${validTicker}`);
            }
        }
    });

    socket.on('disconnect', () => {
        const email = socketToUserMap[socket.id];
        delete socketToUserMap[socket.id]; 
        console.log(`User disconnected: ${email || socket.id}`);
    });
});


// --- Real-time Price Update Loop ---

// 2) & 3) Update the stock prices of subscribed stock without refreshing the dashboard
// The app supports at least two users and updates asynchronously.
setInterval(() => {
    // Iterate over all supported stocks
    SUPPORTED_STOCKS.forEach(ticker => {
        // 1. Simulate new price
        const basePrice = BASE_PRICES[ticker];
        const newPrice = getRandomPriceChange(currentPrices[ticker]); 
        currentPrices[ticker] = newPrice; // Update the persistent current price
        
        // 2. Calculate Percentage Change
        const percentageChange = ((newPrice - basePrice) / basePrice) * 100;
        
        // 3. Prepare the update data payload
        const updatePayload = {
            ticker: ticker,
            price: newPrice.toFixed(2),
            change: percentageChange.toFixed(2) // % Change since BASE_PRICE
        };

        // 4. Iterate over all connected users and send the update only if they are subscribed
        Object.entries(socketToUserMap).forEach(([socketId, email]) => {
            const subscriptions = userSubscriptions[email] || [];
            
            // This is the core logic for asynchronous, user-specific updates:
            // io.to(socketId).emit sends the message only to that specific client socket.
            if (subscriptions.includes(ticker)) {
                io.to(socketId).emit('stock_update', updatePayload);
            }
        });
    });
}, 1000); // Update every 1000 milliseconds (1 second)


// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('You can access the dashboard by navigating to this address in your browser.');
});