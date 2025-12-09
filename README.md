# Estocks - Real-time Stock Trading Dashboard

Estocks is a real-time stock trading dashboard application that provides live stock updates, user portfolio management, and dynamic financial statistics. Built with Node.js, Express, and Socket.IO, it delivers a seamless and responsive user experience.

## 🚀 Features

- **Real-time Stock Updates**: Live price updates pushed to the client using Socket.IO without page refreshes.
- **User Authentication**: Simple email-based login system to manage personal sessions.
- **Portfolio Management**:
    - **Subscribe**: Add stocks to your watchlist (e.g., GOOG, TSLA, AMZN, META, NVDA).
    - **Unsubscribe**: Remove stocks from your view.
- **Dynamic Dashboard Stats**:
    - **Portfolio Value**: Calculates total value based on simulated holdings.
    - **Day Gain**: Tracks daily profit/loss performance.
    - **Buying Power**: Simulates available capital for trading.
- **Interactive UI**:
    - **Sparkline Charts**: Visual trend indicators for stock performance.
    - **Theme Toggle**: Switch between Light and Dark modes.
    - **Responsive Design**: Optimized for both desktop and mobile devices.
- **Deployment Ready**: Configured for deployment on Vercel.

## 🛠️ Technologies Used

### Backend
- **Node.js**: Runtime environment.
- **Express.js**: Web server framework.
- **Socket.IO**: Real-time bidirectional event-based communication.

### Frontend
- **HTML5 & CSS3**: Core structure and styling (with CSS Variables for theming).
- **JavaScript (Vanilla)**: Client-side logic for DOM manipulation and Socket.IO client integration.

## 📂 Project Structure

```
stock-dashboard-app/
├── public/              # Static frontend files
│   ├── index.html       # Main HTML entry point
│   ├── style.css        # Application styling and themes
│   └── client.js        # Frontend logic and Socket.IO handling
├── server.js            # Main backend server and simulation logic
├── package.json         # Project dependencies and scripts
├── vercel.json          # Vercel deployment configuration
└── README.md            # Project documentation
```

## ⚡ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher) installed on your machine.
- [npm](https://www.npmjs.com/) (Node Package Manager).

### Installation

1.  **Clone the repository** (or download the source code):
    ```bash
    git clone <repository-url>
    cd stock-dashboard-app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

### Running Locally

1.  **Start the server**:
    ```bash
    node server.js
    ```
    *Alternatively, if `nodemon` is installed:*
    ```bash
    npx nodemon server.js
    ```

2.  **Access the application**:
    Open your browser and navigate to:
    `http://localhost:3000`

## 📖 Usage Guide

1.  **Login**: Enter your email address to sign in (e.g., `user@example.com`).
2.  **Dashboard**: You will see the main dashboard with simulated "Account Balance" and "Buying Power".
3.  **Manage Stocks**:
    - Click **"Add Stocks"** to subscribe to new tickers.
    - Click the **"Unsubscribe"** button next to any stock to remove it from your list.
4.  **View Updates**: Watch as stock prices update in real-time with color-coded indicators (Green for up, Red for down).
5.  **Settings**: access the Settings page to toggle between Light and Dark themes or update your profile.

## ☁️ Deployment

This project is configured for deployment on **Vercel**.

1.  Install the Vercel CLI or connect your GitHub repository to Vercel.
2.  The `vercel.json` file handles the configuration for serverless functions.
3.  Deploy using:
    ```bash
    vercel
    ```

## 📜 License

This project is open-source and available for educational purposes.
