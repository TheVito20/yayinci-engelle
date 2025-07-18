// Yayıncı Engelle - Popup JavaScript
class StreamerBlocker {
    constructor() {
        this.blockedStreamers = [];
        this.blockedKeywords = [];
        this.blockedCategories = [];
        this.availableCategories = [];
        this.settings = {
            silentMode: false,
            blurMode: false
        };
        
        this.motivationalTexts = [
            "Bugün de kanserden korundun, iyi iş ✌️",
            "Gözüme gözükmesin dedin, dedirtmedik.",
            "Temiz Kick deneyimi aktif ✨",
            "Zihin sağlığın korunuyor 🧠",
            "Kaliteli içerik filtresi çalışıyor 🎯"
        ];
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateUI();
        this.rotateMotivationalText();
        await this.fetchCategories();
    }
    
    async loadData() {
        try {
            const result = await chrome.storage.local.get([
                'blockedStreamers', 
                'blockedKeywords', 
                'blockedCategories', 
                'settings'
            ]);
            
            this.blockedStreamers = result.blockedStreamers || [];
            this.blockedKeywords = result.blockedKeywords || [];
            this.blockedCategories = result.blockedCategories || [];
            this.settings = { ...this.settings, ...result.settings };
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
        }
    }
    
    async saveData() {
        try {
            await chrome.storage.local.set({
                blockedStreamers: this.blockedStreamers,
                blockedKeywords: this.blockedKeywords,
                blockedCategories: this.blockedCategories,
                settings: this.settings
            });
        } catch (error) {
            console.error('Veri kaydetme hatası:', error);
        }
    }
    
    setupEventListeners() {
        // Streamer ekleme
        document.getElementById('addStreamer').addEventListener('click', () => {
            this.addStreamer();
        });
        
        document.getElementById('streamerInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addStreamer();
            }
        });
        
        // Keyword ekleme
        document.getElementById('addKeyword').addEventListener('click', () => {
            this.addKeyword();
        });
        
        document.getElementById('keywordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addKeyword();
            }
        });
        
        // Kategori arama ve yönetimi
        document.getElementById('categorySearch').addEventListener('input', (e) => {
            this.searchCategories(e.target.value);
        });
        
        document.getElementById('refreshCategories').addEventListener('click', () => {
            this.fetchCategories(true);
        });
        
        // Dropdown dışına tıklandığında kapat
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.category-search-section')) {
                this.hideCategoryDropdown();
            }
        });
        
        // Ayarlar
        document.getElementById('silentMode').addEventListener('change', (e) => {
            this.settings.silentMode = e.target.checked;
            this.saveData();
        });
        
        document.getElementById('blurMode').addEventListener('change', (e) => {
            this.settings.blurMode = e.target.checked;
            this.saveData();
            this.notifyContentScript();
        });
        
        // Export/Import
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
    }
    
    async addStreamer() {
        const input = document.getElementById('streamerInput');
        const streamerName = input.value.trim().toLowerCase();
        
        if (!streamerName) {
            this.showToast('Yayıncı adı boş olamaz!', 'error');
            return;
        }
        
        if (this.blockedStreamers.includes(streamerName)) {
            this.showToast('Bu yayıncı zaten engellendi!', 'warning');
            return;
        }
        
        this.blockedStreamers.push(streamerName);
        await this.saveData();
        this.updateBlockedList();
        this.updateStats();
        this.notifyContentScript();
        
        input.value = '';
        
        if (!this.settings.silentMode) {
            this.showToast(`${streamerName} sonsuzluğa uğurlandı! 👋`, 'success');
        }
    }
    
    async removeStreamer(streamerName) {
        const index = this.blockedStreamers.indexOf(streamerName);
        if (index > -1) {
            this.blockedStreamers.splice(index, 1);
            await this.saveData();
            this.updateBlockedList();
            this.updateStats();
            this.notifyContentScript();
            
            if (!this.settings.silentMode) {
                this.showToast(`${streamerName} affedildi! 🎉`, 'info');
            }
        }
    }
    
    async addKeyword() {
        const input = document.getElementById('keywordInput');
        const keyword = input.value.trim().toLowerCase();
        
        if (!keyword) {
            this.showToast('Anahtar kelime boş olamaz!', 'error');
            return;
        }
        
        if (this.blockedKeywords.includes(keyword)) {
            this.showToast('Bu kelime zaten engellendi!', 'warning');
            return;
        }
        
        this.blockedKeywords.push(keyword);
        await this.saveData();
        this.updateKeywordTags();
        this.notifyContentScript();
        
        input.value = '';
        
        if (!this.settings.silentMode) {
            this.showToast(`"${keyword}" kelimesi engellendi! 🚫`, 'success');
        }
    }
    
    async removeKeyword(keyword) {
        const index = this.blockedKeywords.indexOf(keyword);
        if (index > -1) {
            this.blockedKeywords.splice(index, 1);
            await this.saveData();
            this.updateKeywordTags();
            this.notifyContentScript();
            
            if (!this.settings.silentMode) {
                this.showToast(`"${keyword}" kelimesi kaldırıldı! ✅`, 'info');
            }
        }
    }
    
    async toggleCategory(category, enabled) {
        if (enabled) {
            if (!this.blockedCategories.includes(category)) {
                this.blockedCategories.push(category);
            }
        } else {
            const index = this.blockedCategories.indexOf(category);
            if (index > -1) {
                this.blockedCategories.splice(index, 1);
            }
        }
        
        await this.saveData();
        this.notifyContentScript();
        
        if (!this.settings.silentMode) {
            const action = enabled ? 'engellendi' : 'kaldırıldı';
            this.showToast(`${category} kategorisi ${action}! 📂`, 'info');
        }
    }
    
    updateUI() {
        this.updateBlockedList();
        this.updateKeywordTags();
        this.updateSelectedCategories();
        this.updateSettings();
        this.updateStats();
    }
    
    updateBlockedList() {
        const container = document.getElementById('blockedList');
        
        if (this.blockedStreamers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Henüz kimse engellenmedi</p>
                    <small>Yukarıdan yayıncı adı ekleyerek başla</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.blockedStreamers.map(streamer => `
            <div class="blocked-item">
                <span class="streamer-name">${streamer}</span>
                <button class="remove-btn" onclick="blocker.removeStreamer('${streamer}')">
                    ❌
                </button>
            </div>
        `).join('');
    }
    
    updateKeywordTags() {
        const container = document.getElementById('keywordTags');
        
        container.innerHTML = this.blockedKeywords.map(keyword => `
            <div class="keyword-tag">
                <span>${keyword}</span>
                <button class="remove-keyword" onclick="blocker.removeKeyword('${keyword}')">
                    ×
                </button>
            </div>
        `).join('');
    }
    
    // Kick.com'dan kategorileri çek
    async fetchCategories(forceRefresh = false) {
        if (this.availableCategories.length > 0 && !forceRefresh) {
            return;
        }
        
        const dropdown = document.getElementById('categoryDropdown');
        dropdown.innerHTML = '<div class="category-loading">Kategoriler yükleniyor...</div>';
        
        try {
            // Kick.com API'sinden kategorileri çek
            const response = await fetch('https://kick.com/api/v2/categories');
            const data = await response.json();
            
            this.availableCategories = data.map(category => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                viewers: category.viewers || 0,
                streamers: category.streamers || 0
            }));
            
            // Popülerlik sırasına göre sırala
            this.availableCategories.sort((a, b) => b.viewers - a.viewers);
            
            dropdown.innerHTML = '';
            
        } catch (error) {
            console.error('Kategori çekme hatası:', error);
            
            // Fallback kategoriler
            this.availableCategories = [
                { id: 1, name: 'Just Chatting', slug: 'just-chatting', viewers: 50000, streamers: 1000 },
                { id: 2, name: 'Slots', slug: 'slots', viewers: 30000, streamers: 500 },
                { id: 3, name: 'League of Legends', slug: 'league-of-legends', viewers: 25000, streamers: 400 },
                { id: 4, name: 'VALORANT', slug: 'valorant', viewers: 20000, streamers: 300 },
                { id: 5, name: 'Counter-Strike 2', slug: 'counter-strike-2', viewers: 15000, streamers: 250 },
                { id: 6, name: 'Grand Theft Auto V', slug: 'grand-theft-auto-v', viewers: 12000, streamers: 200 },
                { id: 7, name: 'Minecraft', slug: 'minecraft', viewers: 10000, streamers: 150 },
                { id: 8, name: 'Fortnite', slug: 'fortnite', viewers: 8000, streamers: 120 },
                { id: 9, name: 'World of Warcraft', slug: 'world-of-warcraft', viewers: 7000, streamers: 100 },
                { id: 10, name: 'Apex Legends', slug: 'apex-legends', viewers: 6000, streamers: 80 }
            ];
            
            dropdown.innerHTML = '<div class="category-loading">Varsayılan kategoriler yüklendi</div>';
            setTimeout(() => dropdown.innerHTML = '', 1000);
        }
    }
    
    // Kategori arama
    searchCategories(query) {
        const dropdown = document.getElementById('categoryDropdown');
        
        if (!query.trim()) {
            this.hideCategoryDropdown();
            return;
        }
        
        const filteredCategories = this.availableCategories.filter(category =>
            category.name.toLowerCase().includes(query.toLowerCase()) ||
            category.slug.toLowerCase().includes(query.toLowerCase())
        );
        
        this.showCategoryDropdown(filteredCategories);
    }
    
    // Kategori dropdown'unu göster
    showCategoryDropdown(categories) {
        const dropdown = document.getElementById('categoryDropdown');
        
        if (categories.length === 0) {
            dropdown.innerHTML = '<div class="category-loading">Kategori bulunamadı</div>';
        } else {
            dropdown.innerHTML = categories.slice(0, 10).map(category => `
                <div class="category-item ${this.blockedCategories.includes(category.name) ? 'selected' : ''}" 
                     onclick="blocker.selectCategory('${category.name}')">
                    <span class="category-name">${category.name}</span>
                    <span class="category-count">${category.viewers.toLocaleString()} izleyici</span>
                </div>
            `).join('');
        }
        
        dropdown.classList.add('show');
    }
    
    // Kategori dropdown'unu gizle
    hideCategoryDropdown() {
        const dropdown = document.getElementById('categoryDropdown');
        dropdown.classList.remove('show');
    }
    
    // Kategori seç
    async selectCategory(categoryName) {
        if (this.blockedCategories.includes(categoryName)) {
            this.showToast('Bu kategori zaten engellendi!', 'warning');
            return;
        }
        
        this.blockedCategories.push(categoryName);
        await this.saveData();
        this.updateSelectedCategories();
        this.updateStats();
        this.notifyContentScript();
        
        // Arama kutusunu temizle ve dropdown'u gizle
        document.getElementById('categorySearch').value = '';
        this.hideCategoryDropdown();
        
        if (!this.settings.silentMode) {
            this.showToast(`${categoryName} kategorisi engellendi! 📂`, 'success');
        }
    }
    
    // Kategoriyi kaldır
    async removeCategory(categoryName) {
        const index = this.blockedCategories.indexOf(categoryName);
        if (index > -1) {
            this.blockedCategories.splice(index, 1);
            await this.saveData();
            this.updateSelectedCategories();
            this.updateStats();
            this.notifyContentScript();
            
            if (!this.settings.silentMode) {
                this.showToast(`${categoryName} kategorisi kaldırıldı! ✅`, 'info');
            }
        }
    }
    
    // Seçilen kategorileri güncelle
    updateSelectedCategories() {
        const container = document.getElementById('selectedCategoriesList');
        
        if (this.blockedCategories.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <small>Henüz kategori engellenmedi</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.blockedCategories.map(category => `
            <div class="selected-category-item">
                <span class="selected-category-name">${category}</span>
                <button class="remove-category-btn" onclick="blocker.removeCategory('${category}')">
                    ❌
                </button>
            </div>
        `).join('');
    }
    
    updateSettings() {
        document.getElementById('silentMode').checked = this.settings.silentMode;
        document.getElementById('blurMode').checked = this.settings.blurMode;
    }
    
    updateStats() {
        const totalBlocked = this.blockedStreamers.length + this.blockedKeywords.length + this.blockedCategories.length;
        document.getElementById('blockedCount').textContent = totalBlocked;
    }
    
    rotateMotivationalText() {
        const textElement = document.getElementById('motivationalText');
        let currentIndex = 0;
        
        setInterval(() => {
            currentIndex = (currentIndex + 1) % this.motivationalTexts.length;
            textElement.style.opacity = '0';
            
            setTimeout(() => {
                textElement.textContent = this.motivationalTexts[currentIndex];
                textElement.style.opacity = '1';
            }, 300);
        }, 5000);
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    exportData() {
        const data = {
            blockedStreamers: this.blockedStreamers,
            blockedKeywords: this.blockedKeywords,
            blockedCategories: this.blockedCategories,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yayinci-engelle-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Veriler dışa aktarıldı! 📤', 'success');
    }
    
    async importData(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.blockedStreamers) this.blockedStreamers = data.blockedStreamers;
            if (data.blockedKeywords) this.blockedKeywords = data.blockedKeywords;
            if (data.blockedCategories) this.blockedCategories = data.blockedCategories;
            if (data.settings) this.settings = { ...this.settings, ...data.settings };
            
            await this.saveData();
            this.updateUI();
            this.notifyContentScript();
            
            this.showToast('Veriler başarıyla içe aktarıldı! 📥', 'success');
        } catch (error) {
            console.error('Import hatası:', error);
            this.showToast('Dosya içe aktarılırken hata oluştu!', 'error');
        }
    }
    
    async notifyContentScript() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes('kick.com')) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateFilters',
                    data: {
                        blockedStreamers: this.blockedStreamers,
                        blockedKeywords: this.blockedKeywords,
                        blockedCategories: this.blockedCategories,
                        settings: this.settings
                    }
                });
            }
        } catch (error) {
            console.error('Content script bildirim hatası:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blocker = new StreamerBlocker();
});
