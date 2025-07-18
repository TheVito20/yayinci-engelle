// Yayıncı Engelle - Content Script
class KickStreamFilter {
    constructor() {
        this.blockedStreamers = [];
        this.blockedKeywords = [];
        this.blockedCategories = [];
        this.settings = {
            silentMode: false,
            blurMode: false
        };
        
        this.observer = null;
        this.processedElements = new Set();
        this.init();
    }
    
    async init() {
        await this.loadFilters();
        this.setupMessageListener();
        this.startObserving();
        this.processExistingElements();
        this.addHoverButtons();
    }
    
    async loadFilters() {
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
            console.error('Filtre yükleme hatası:', error);
        }
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'updateFilters') {
                this.blockedStreamers = message.data.blockedStreamers || [];
                this.blockedKeywords = message.data.blockedKeywords || [];
                this.blockedCategories = message.data.blockedCategories || [];
                this.settings = { ...this.settings, ...message.data.settings };
                
                this.processedElements.clear();
                this.processExistingElements();
                sendResponse({ success: true });
            }
        });
    }
    
    startObserving() {
        this.observer = new MutationObserver((mutations) => {
            let shouldProcess = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            shouldProcess = true;
                        }
                    });
                }
            });
            
            if (shouldProcess) {
                setTimeout(() => this.processExistingElements(), 100);
            }
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    processExistingElements() {
        // Kick.com'daki farklı stream kart selectorları
        const streamSelectors = [
            '[data-testid="stream-card"]',
            '.stream-card',
            '[class*="stream"]',
            '[class*="channel"]',
            'a[href*="/"]' // Genel link selectorü
        ];
        
        streamSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => this.processStreamElement(element));
        });
        
        // Sidebar ve diğer yayıncı listelerini de kontrol et
        this.processSidebarElements();
    }
    
    processStreamElement(element) {
        if (this.processedElements.has(element)) return;
        
        const streamerInfo = this.extractStreamerInfo(element);
        if (!streamerInfo) return;
        
        const blockResult = this.shouldBlockStreamer(streamerInfo);
        
        if (blockResult.blocked) {
            this.blockElement(element, streamerInfo, blockResult);
        } else {
            this.unblockElement(element);
        }
        
        this.processedElements.add(element);
    }
    
    extractStreamerInfo(element) {
        try {
            // Farklı yöntemlerle streamer bilgisini çıkar
            let streamerName = '';
            let title = '';
            let category = '';
            
            // Streamer adını bul
            const nameSelectors = [
                '[data-testid="stream-username"]',
                '.stream-username',
                '.streamer-name',
                '.channel-name',
                'h3', 'h4', 'h5',
                '[class*="username"]',
                '[class*="name"]'
            ];
            
            for (const selector of nameSelectors) {
                const nameElement = element.querySelector(selector);
                if (nameElement && nameElement.textContent.trim()) {
                    streamerName = nameElement.textContent.trim().toLowerCase();
                    break;
                }
            }
            
            // Eğer element kendisi bir link ise, href'ten streamer adını çıkar
            if (!streamerName && element.tagName === 'A') {
                const href = element.getAttribute('href');
                if (href && href.includes('/')) {
                    const pathParts = href.split('/').filter(part => part.length > 0);
                    if (pathParts.length > 0) {
                        streamerName = pathParts[pathParts.length - 1].toLowerCase();
                    }
                }
            }
            
            // Başlık ve kategori bilgisini bul
            const titleElement = element.querySelector('[data-testid="stream-title"], .stream-title, .title');
            if (titleElement) {
                title = titleElement.textContent.trim().toLowerCase();
            }
            
            const categoryElement = element.querySelector('[data-testid="stream-category"], .stream-category, .category');
            if (categoryElement) {
                category = categoryElement.textContent.trim();
            }
            
            if (!streamerName) return null;
            
            return {
                name: streamerName,
                title: title,
                category: category,
                element: element
            };
        } catch (error) {
            console.error('Streamer bilgisi çıkarma hatası:', error);
            return null;
        }
    }
    
    shouldBlockStreamer(streamerInfo) {
        // Streamer adı kontrolü
        if (this.blockedStreamers.includes(streamerInfo.name)) {
            return { blocked: true, reason: 'streamer', value: streamerInfo.name };
        }
        
        // Anahtar kelime kontrolü
        for (const keyword of this.blockedKeywords) {
            if (streamerInfo.title.includes(keyword) || streamerInfo.name.includes(keyword)) {
                return { blocked: true, reason: 'keyword', value: keyword };
            }
        }
        
        // Kategori kontrolü - daha esnek eşleştirme
        for (const blockedCategory of this.blockedCategories) {
            if (this.isCategoryMatch(streamerInfo.category, blockedCategory)) {
                return { blocked: true, reason: 'category', value: blockedCategory };
            }
        }
        
        return { blocked: false };
    }
    
    // Kategori eşleştirme - farklı yazım şekillerini destekle
    isCategoryMatch(streamCategory, blockedCategory) {
        if (!streamCategory || !blockedCategory) return false;
        
        const normalize = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        const normalizedStream = normalize(streamCategory);
        const normalizedBlocked = normalize(blockedCategory);
        
        return normalizedStream === normalizedBlocked || 
               normalizedStream.includes(normalizedBlocked) ||
               normalizedBlocked.includes(normalizedStream);
    }
    
    blockElement(element, streamerInfo, blockResult) {
        if (this.settings.blurMode) {
            this.blurElement(element, streamerInfo, blockResult);
        } else {
            this.hideElement(element, streamerInfo, blockResult);
        }
        
        // Yayın sayfasında isek ve bu yayıncı engellenmiş ise sayfayı yönlendir
        this.checkAndRedirectStreamPage(streamerInfo, blockResult);
    }
    
    hideElement(element, streamerInfo, blockResult) {
        element.style.transition = 'all 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            element.style.display = 'none';
            element.setAttribute('data-blocked', 'true');
            element.setAttribute('data-blocked-reason', this.getBlockReason(blockResult));
        }, 300);
    }
    
    blurElement(element, streamerInfo, blockResult) {
        element.style.filter = 'blur(5px) grayscale(100%)';
        element.style.opacity = '0.3';
        element.style.pointerEvents = 'none';
        element.setAttribute('data-blurred', 'true');
        element.setAttribute('data-blocked-reason', this.getBlockReason(blockResult));
        
        // Blur overlay ekle
        const overlay = document.createElement('div');
        overlay.className = 'blocked-overlay';
        overlay.innerHTML = `
            <div class="blocked-message">
                <span class="blocked-icon">🚫</span>
                <span class="blocked-text">Engellendi</span>
                <small class="block-reason">${this.getBlockReason(blockResult)}</small>
            </div>
        `;
        
        element.style.position = 'relative';
        element.appendChild(overlay);
    }
    
    unblockElement(element) {
        element.style.display = '';
        element.style.opacity = '';
        element.style.transform = '';
        element.style.filter = '';
        element.style.pointerEvents = '';
        element.removeAttribute('data-blocked');
        element.removeAttribute('data-blurred');
        element.removeAttribute('data-blocked-reason');
        
        const overlay = element.querySelector('.blocked-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    getBlockReason(blockResult) {
        if (!blockResult || !blockResult.blocked) {
            return 'Bilinmeyen sebep';
        }
        
        switch (blockResult.reason) {
            case 'streamer':
                return `Yayıncı: ${blockResult.value}`;
            case 'keyword':
                return `Anahtar kelime: ${blockResult.value}`;
            case 'category':
                return `Kategori: ${blockResult.value}`;
            default:
                return 'Bilinmeyen sebep';
        }
    }
    
    // Yayın sayfası engelleme kontrolü
    checkAndRedirectStreamPage(streamerInfo, blockResult) {
        const currentUrl = window.location.href;
        const currentPath = window.location.pathname;
        
        // Eğer bir yayıncının sayfasındaysak ve o yayıncı engellenmiş ise
        if (currentPath.includes('/') && currentPath.split('/').length >= 2) {
            const urlStreamerName = currentPath.split('/')[1].toLowerCase();
            
            if (blockResult.blocked && 
                (blockResult.reason === 'streamer' && urlStreamerName === streamerInfo.name) ||
                (blockResult.reason === 'category' && this.isCurrentStreamBlocked())) {
                
                this.redirectToHomePage(blockResult);
            }
        }
    }
    
    // Mevcut yayının engellenip engellenmediğini kontrol et
    isCurrentStreamBlocked() {
        // Sayfa başlığından veya meta verilerden kategori bilgisini çek
        const categoryElements = document.querySelectorAll(
            '[data-testid="stream-category"], .stream-category, .category, [class*="category"]'
        );
        
        for (const element of categoryElements) {
            const categoryText = element.textContent.trim();
            for (const blockedCategory of this.blockedCategories) {
                if (this.isCategoryMatch(categoryText, blockedCategory)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Ana sayfaya yönlendir
    redirectToHomePage(blockResult) {
        // Önce uyarı göster
        this.showBlockedPageWarning(blockResult);
        
        // 3 saniye sonra yönlendir
        setTimeout(() => {
            window.location.href = 'https://kick.com';
        }, 3000);
    }
    
    // Engellenen sayfa uyarısı göster
    showBlockedPageWarning(blockResult) {
        // Eğer zaten uyarı varsa çıkış yap
        if (document.querySelector('.blocked-page-warning')) {
            return;
        }
        
        const warning = document.createElement('div');
        warning.className = 'blocked-page-warning';
        warning.innerHTML = `
            <div class="blocked-page-content">
                <div class="blocked-page-icon">🚫</div>
                <h2>Bu Yayın Engellendi</h2>
                <p><strong>Sebep:</strong> ${this.getBlockReason(blockResult)}</p>
                <p>3 saniye içinde ana sayfaya yönlendirileceksiniz...</p>
                <div class="blocked-page-actions">
                    <button onclick="window.location.href='https://kick.com'" class="btn-home">
                        Ana Sayfaya Git
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-close">
                        Kapat
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // Animasyon için kısa gecikme
        setTimeout(() => {
            warning.classList.add('show');
        }, 100);
    }
    
    processSidebarElements() {
        // Sidebar'daki yayıncı listelerini kontrol et
        const sidebarSelectors = [
            '[class*="sidebar"]',
            '[class*="recommended"]',
            '[class*="following"]',
            '.live-channels',
            '.channel-list'
        ];
        
        sidebarSelectors.forEach(selector => {
            const containers = document.querySelectorAll(selector);
            containers.forEach(container => {
                const streamElements = container.querySelectorAll('a, [class*="channel"], [class*="stream"]');
                streamElements.forEach(element => this.processStreamElement(element));
            });
        });
    }
    
    addHoverButtons() {
        // Hover'da hızlı engelleme butonu ekle
        document.addEventListener('mouseover', (e) => {
            const streamElement = e.target.closest('[data-testid="stream-card"], .stream-card, a[href*="/"]');
            if (!streamElement || streamElement.hasAttribute('data-blocked')) return;
            
            const streamerInfo = this.extractStreamerInfo(streamElement);
            if (!streamerInfo) return;
            
            this.showQuickBlockButton(streamElement, streamerInfo);
        });
        
        document.addEventListener('mouseout', (e) => {
            const quickButton = document.querySelector('.quick-block-btn');
            if (quickButton && !quickButton.contains(e.relatedTarget)) {
                quickButton.remove();
            }
        });
    }
    
    showQuickBlockButton(element, streamerInfo) {
        // Önceki butonu kaldır
        const existingButton = document.querySelector('.quick-block-btn');
        if (existingButton) existingButton.remove();
        
        const button = document.createElement('button');
        button.className = 'quick-block-btn';
        button.innerHTML = '🚫';
        button.title = `${streamerInfo.name} adlı yayıncıyı engelle`;
        
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            await this.quickBlockStreamer(streamerInfo.name);
            button.remove();
        });
        
        element.style.position = 'relative';
        element.appendChild(button);
    }
    
    async quickBlockStreamer(streamerName) {
        try {
            const result = await chrome.storage.local.get('blockedStreamers');
            const blockedStreamers = result.blockedStreamers || [];
            
            if (!blockedStreamers.includes(streamerName)) {
                blockedStreamers.push(streamerName);
                await chrome.storage.local.set({ blockedStreamers });
                
                this.blockedStreamers = blockedStreamers;
                this.processedElements.clear();
                this.processExistingElements();
                
                // Bildirim göster
                if (!this.settings.silentMode) {
                    this.showNotification(`${streamerName} engellendi! 🚫`);
                }
            }
        } catch (error) {
            console.error('Hızlı engelleme hatası:', error);
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'streamer-block-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new KickStreamFilter();
    });
} else {
    new KickStreamFilter();
}
