
// eCOMLeaderboard 2025 - Main Application Logic

// --- DATA STORAGE ---
// This class manages all data using localStorage, acting as a mock database.
class DataStore {
    constructor() {
        this.stores = JSON.parse(localStorage.getItem('ecomLeaderStores') || '[]');
        this.transactions = JSON.parse(localStorage.getItem('ecomLeaderTransactions') || '[]');
        this.initializeDemoData();
    }

    initializeDemoData() {
        if (this.stores.length === 0) {
            const demoStores = [
                { name: 'TechWorld Store', email: 'demo@techworld.com', url: 'https://techworld.com' },
                { name: 'Fashion Hub', email: 'demo@fashionhub.com', url: 'https://fashionhub.com' },
                { name: 'Home Essentials', email: 'demo@homeessentials.com', url: 'https://homeessentials.com' },
                { name: 'Sports Central', email: 'demo@sportscentral.com', url: 'https://sportscentral.com' },
                { name: 'Beauty Corner', email: 'demo@beautycorner.com', url: 'https://beautycorner.com' },
            ];

            this.stores = demoStores.map((store, i) => ({
                ...store,
                id: `demo${i + 1}`,
                password: 'password123', // In a real app, this should be hashed.
                apiKey: `apiKey-demo${i + 1}-${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date(Date.now() - (30 - i * 5) * 24 * 60 * 60 * 1000).toISOString()
            }));
            localStorage.setItem('ecomLeaderStores', JSON.stringify(this.stores));

            const demoTransactions = this.stores.flatMap(store => {
                let txs = [];
                for (let i = 0; i < Math.floor(Math.random() * 50) + 20; i++) {
                    txs.push({
                        id: `tx_${store.id}_${i}`,
                        storeId: store.id,
                        amount: parseFloat((Math.random() * 200 + 10).toFixed(2)),
                        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
                    });
                }
                return txs;
            });
            this.transactions = demoTransactions;
            localStorage.setItem('ecomLeaderTransactions', JSON.stringify(this.transactions));
        }
    }

    addStore(storeData) {
        const newStore = {
            id: `store_${Date.now()}`,
            apiKey: `apiKey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            ...storeData
        };
        this.stores.push(newStore);
        localStorage.setItem('ecomLeaderStores', JSON.stringify(this.stores));
        return newStore;
    }
    
    updateStore(storeId, updatedData) {
        this.stores = this.stores.map(store => {
            if (store.id === storeId) {
                return { ...store, ...updatedData };
            }
            return store;
        });
        localStorage.setItem('ecomLeaderStores', JSON.stringify(this.stores));
    }

    deleteStore(storeId) {
        this.stores = this.stores.filter(s => s.id !== storeId);
        // Also delete associated transactions
        this.transactions = this.transactions.filter(t => t.storeId !== storeId);
        localStorage.setItem('ecomLeaderStores', JSON.stringify(this.stores));
        localStorage.setItem('ecomLeaderTransactions', JSON.stringify(this.transactions));
    }

    getStoreByEmail(email) {
        return this.stores.find(s => s.email === email);
    }
    
    getStoreById(id) {
        return this.stores.find(s => s.id === id);
    }

    getRecentTransactions(storeId, limit = 5) {
        return this.transactions
            .filter(t => t.storeId === storeId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    getStoreStats(storeId) {
        const storeTransactions = this.transactions.filter(t => t.storeId === storeId);
        const totalRevenue = storeTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalOrders = storeTransactions.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const leaderboard = this.stores.map(s => {
            const revenue = this.transactions
                .filter(t => t.storeId === s.id)
                .reduce((sum, t) => sum + t.amount, 0);
            return { id: s.id, revenue };
        }).sort((a, b) => b.revenue - a.revenue);

        const rank = leaderboard.findIndex(s => s.id === storeId) + 1;
        return { totalRevenue, totalOrders, avgOrderValue, rank: rank > 0 ? rank : this.stores.length };
    }
}

// --- EMAIL NOTIFICATION SERVICE ---
function initializeEmailService() {
    // IMPORTANT: Replace with your actual User ID from your EmailJS account.
    emailjs.init({ publicKey: 'YOUR_PUBLIC_KEY' });
}

function sendNewRegistrationEmail(storeData) {
    // IMPORTANT: You must create a template in your EmailJS account.
    // This object's properties should match the variables in your template.
    // For example, your template might have variables like {{store_name}}, {{store_email}}, {{store_url}}.
    const templateParams = {
        store_name: storeData.name,
        store_email: storeData.email,
        store_url: storeData.url,
        registration_date: new Date().toUTCString(),
    };

    // IMPORTANT: Replace with your actual Service ID and Template ID.
    const serviceID = 'YOUR_SERVICE_ID';
    const templateID = 'YOUR_TEMPLATE_ID';

    emailjs.send(serviceID, templateID, templateParams)
        .then(response => {
           console.log('SUCCESS! New registration email sent.', response.status, response.text);
        }, (error) => {
           console.error('FAILED to send registration email.', error);
           // You could add a fallback or logging here.
        });
}


// --- APP STATE & LOGIC ---

let dataStore;
let currentStore = null;

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.querySelector('.tab-btn[onclick="showLogin()"]').classList.add('active');
    document.querySelector('.tab-btn[onclick="showRegister()"]').classList.remove('active');
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.querySelector('.tab-btn[onclick="showLogin()"]').classList.remove('active');
    document.querySelector('.tab-btn[onclick="showRegister()"]').classList.add('active');
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Special case for Admin login
    if (email === 'bebell.digitalsolutions@gmail.com' && password === 'Bebell/25') {
        // Find or create an admin store representation if needed, or just redirect.
        // For simplicity, we'll find the first demo user to act as the "admin context"
        const adminUser = dataStore.getStoreByEmail('demo@techworld.com') || dataStore.stores[0];
        if (adminUser) {
            sessionStorage.setItem('currentStoreId', adminUser.id);
        }
        window.location.href = 'backend.html';
        return; // Stop further execution
    }

    const store = dataStore.getStoreByEmail(email);

    if (store && store.password === password) {
        currentStore = store;
        sessionStorage.setItem('currentStoreId', store.id);
        initializeApp();
    } else {
        alert('Invalid email or password.');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const storeName = document.getElementById('storeName').value;
    const storeId = document.getElementById('storeId').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const url = document.getElementById('storeUrl').value;

    if (dataStore.getStoreByEmail(email)) {
        alert('A store with this email already exists.');
        return;
    }

    const newStoreData = { name: storeName, id: storeId, email, password, url };
    const newStore = dataStore.addStore(newStoreData);
    
    // Send email notification
    sendNewRegistrationEmail(newStore);

    currentStore = newStore;
    sessionStorage.setItem('currentStoreId', newStore.id);
    initializeApp();
}

function logout() {
    currentStore = null;
    sessionStorage.removeItem('currentStoreId');
    initializeApp();
}

function updateDashboard() {
    if (!currentStore) return;
    document.getElementById('userStoreName').textContent = currentStore.name;
    const stats = dataStore.getStoreStats(currentStore.id);
    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    document.getElementById('totalRevenue').textContent = formatCurrency(stats.totalRevenue);
    document.getElementById('totalOrders').textContent = stats.totalOrders;
    document.getElementById('leaderboardRank').textContent = `#${stats.rank}`;
    document.getElementById('avgOrderValue').textContent = formatCurrency(stats.avgOrderValue);

    const trackingCodeEl = document.getElementById('trackingCode');
    trackingCodeEl.textContent = `<script>\n  window.eCOMLeaderboard = { apiKey: '${currentStore.apiKey}' };\n<\/script>\n<script async src="/tracking.js"><\/script>`;
    
    updateRecentActivity();
}

function updateRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    const recentTxs = dataStore.getRecentTransactions(currentStore.id);
    
    activityList.innerHTML = ''; // Clear previous entries
    
    if (recentTxs.length === 0) {
        activityList.innerHTML = '<div class="activity-item">No recent activity.</div>';
        return;
    }
    
    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    
    recentTxs.forEach(tx => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <i data-lucide="dollar-sign" class="lucide-icon"></i>
            <span>New sale: <strong>${formatCurrency(tx.amount)}</strong></span>
            <span class="activity-time">${new Date(tx.timestamp).toLocaleString()}</span>
        `;
        activityList.appendChild(item);
    });
    lucide.createIcons();
}


function copyTrackingCode() {
    const code = document.getElementById('trackingCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const button = document.querySelector('button[onclick="copyTrackingCode()"]');
        button.innerHTML = 'Copied!';
        setTimeout(() => {
            button.innerHTML = 'Copy Code';
        }, 2000);
    }, () => {
        alert('Failed to copy code.');
    });
}

function testConnection() {
    const statusEl = document.getElementById('connectionStatus');
    const dotEl = statusEl.querySelector('.status-dot');
    const textEl = document.getElementById('connectionStatusText');
    const button = document.querySelector('button[onclick="testConnection()"]');

    statusEl.style.display = 'flex';
    textEl.textContent = 'Testing...';
    dotEl.className = 'status-dot'; // Reset class
    dotEl.style.background = 'var(--warning-color)';
    button.disabled = true;

    setTimeout(() => {
        const trackedData = localStorage.getItem('ecomLeaderboardTracking');
        const isConnected = trackedData && JSON.parse(trackedData).length > 0;

        if (isConnected) {
            textEl.textContent = 'Connection Successful!';
            dotEl.classList.add('connected');
            dotEl.style.background = 'var(--success-color)';
        } else {
            textEl.textContent = 'No Data Received';
            dotEl.style.background = 'var(--error-color)';
        }
        button.disabled = false;
    }, 2000);
}

// --- INITIALIZATION ---
function initializeApp() {
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const navLinks = document.querySelector('.nav-links');

    // Only run initialization if the necessary elements are on the page.
    // This prevents errors on pages that don't have these elements (like backend.html).
    if (!authSection || !dashboardSection) return;

    const storeId = sessionStorage.getItem('currentStoreId');
    if (storeId) {
        currentStore = dataStore.getStoreById(storeId);
    } else {
        currentStore = null;
    }

    if (currentStore) {
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        navLinks.style.display = 'flex';
        updateDashboard();
    } else {
        authSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
        showLogin();
    }
    // Re-initialize icons if they were dynamically added
    lucide.createIcons();
}


document.addEventListener('DOMContentLoaded', () => {
    dataStore = new DataStore();
    try {
        initializeEmailService();
    } catch (e) {
        console.warn("EmailJS not configured. Please add your credentials to app.js.");
    }
    initializeApp();
});
