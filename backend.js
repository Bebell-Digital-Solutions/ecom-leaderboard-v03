
// Admin Panel Logic for eCOMLeaderboard 2025

// The full DataStore class to ensure the backend page is self-sufficient and consistent.
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
    
    getAllStores() {
        return this.stores.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getStoreById(id) {
        return this.stores.find(s => s.id === id);
    }

    updateStore(storeId, updatedData) {
        this.stores = this.stores.map(store => {
            if (store.id === storeId) {
                // Ensure we don't overwrite critical fields not in the edit form
                return { ...store, ...updatedData };
            }
            return store;
        });
        localStorage.setItem('ecomLeaderStores', JSON.stringify(this.stores));
    }

    deleteStore(storeId) {
        this.stores = this.stores.filter(s => s.id !== storeId);
        this.transactions = this.transactions.filter(t => t.storeId !== storeId);

        localStorage.setItem('ecomLeaderStores', JSON.stringify(this.stores));
        localStorage.setItem('ecomLeaderTransactions', JSON.stringify(this.transactions));
    }
}


class BackendManager {
    constructor() {
        this.dataStore = new DataStore();
        this.tableContent = document.getElementById('adminTableContent');
        this.modal = document.getElementById('editStoreModal');
        this.editForm = document.getElementById('editStoreForm');
    }

    initialize() {
        this.renderTable();
        this.editForm.addEventListener('submit', (e) => this.handleSave(e));
    }

    renderTable() {
        const stores = this.dataStore.getAllStores();
        this.tableContent.innerHTML = ''; // Clear existing content

        if (stores.length === 0) {
            this.tableContent.innerHTML = '<div class="admin-table-row" style="text-align: center; grid-column: 1 / -1;">No stores found.</div>';
            return;
        }

        stores.forEach(store => {
            const row = document.createElement('div');
            row.className = 'admin-table-row';
            row.innerHTML = `
                <div>${store.name}</div>
                <div>${store.email}</div>
                <div><a href="${store.url}" target="_blank" rel="noopener noreferrer">${this.formatUrl(store.url)}</a></div>
                <div>${new Date(store.createdAt).toLocaleDateString()}</div>
                <div class="admin-actions">
                    <button class="btn-icon btn-edit" onclick="backendManager.handleEdit('${store.id}')">
                        <i data-lucide="edit"></i> Edit
                    </button>
                    <button class="btn-icon btn-delete" onclick="backendManager.handleDelete('${store.id}')">
                        <i data-lucide="trash-2"></i> Delete
                    </button>
                </div>
            `;
            this.tableContent.appendChild(row);
        });
        
        lucide.createIcons();
    }

    handleEdit(storeId) {
        const store = this.dataStore.getStoreById(storeId);
        if (store) {
            document.getElementById('editStoreId').value = store.id;
            document.getElementById('editStoreName').value = store.name;
            document.getElementById('editStoreUrl').value = store.url;
            document.getElementById('editStoreEmail').value = store.email;
            this.modal.style.display = 'flex';
        }
    }

    handleSave(event) {
        event.preventDefault();
        const storeId = document.getElementById('editStoreId').value;
        const updatedData = {
            name: document.getElementById('editStoreName').value,
            url: document.getElementById('editStoreUrl').value,
            email: document.getElementById('editStoreEmail').value,
        };
        this.dataStore.updateStore(storeId, updatedData);
        this.closeEditModal();
        this.renderTable();
    }
    
    handleDelete(storeId) {
        const store = this.dataStore.getStoreById(storeId);
        if (!store) return;

        const confirmation = confirm(`Are you sure you want to delete the store "${store.name}"? This action cannot be undone.`);
        if (confirmation) {
            this.dataStore.deleteStore(storeId);
            this.renderTable();
        }
    }

    closeEditModal() {
        this.modal.style.display = 'none';
        this.editForm.reset();
    }
    
    formatUrl(url) {
        if (!url) return '';
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
}

// Global function to be called from the modal's close button
function closeEditModal() {
    backendManager.closeEditModal();
}

const backendManager = new BackendManager();
document.addEventListener('DOMContentLoaded', () => {
    backendManager.initialize();
});
