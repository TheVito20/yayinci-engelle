// Yayıncı Engelle - Background Script (Service Worker)
class BackgroundService {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupInstallListener();
        this.setupTabUpdateListener();
        this.setupStorageListener();
        this.setupContextMenus();
    }
    
    setupInstallListener() {
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.handleFirstInstall();
            } else if (details.reason === 'update') {
                this.handleUpdate(details.previousVersion);
            }
        });
    }
    
    async handleFirstInstall() {
        // İlk kurulumda varsayılan ayarları yükle
        const defaultSettings = {
            blockedStreamers: [],
            blockedKeywords: [],
            blockedCategories: [],
            settings: {
                silentMode: false,
                blurMode: false
            },
            installDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        await chrome.storage.local.set(defaultSettings);
        
        // Hoş geldin sayfasını aç (isteğe bağlı)
        // chrome.tabs.create({ url: 'welcome.html' });
        
        console.log('Yayıncı Engelle eklentisi başarıyla kuruldu!');
    }
    
    async handleUpdate(previousVersion) {
        console.log(`Eklenti güncellendi: ${previousVersion} -> 1.0.0`);
        
        // Güncelleme sonrası veri migrasyonu (gerekirse)
        await this.migrateData(previousVersion);
    }
    
    async migrateData(previousVersion) {
        try {
            const data = await chrome.storage.local.get();
            
            // Versiyon bazlı migrasyon işlemleri
            if (previousVersion && this.compareVersions(previousVersion, '1.0.0') < 0) {
                // Eski versiyondan yeni versiyona geçiş işlemleri
                console.log('Veri migrasyonu tamamlandı');
            }
        } catch (error) {
            console.error('Veri migrasyonu hatası:', error);
        }
    }
    
    compareVersions(version1, version2) {
        const v1parts = version1.split('.').map(Number);
        const v2parts = version2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
            const v1part = v1parts[i] || 0;
            const v2part = v2parts[i] || 0;
            
            if (v1part < v2part) return -1;
            if (v1part > v2part) return 1;
        }
        
        return 0;
    }
    
    setupTabUpdateListener() {
        chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url && tab.url.includes('kick.com')) {
                // Kick.com sayfası yüklendiğinde content script'e filtreleri gönder
                await this.sendFiltersToTab(tabId);
            }
        });
    }
    
    async sendFiltersToTab(tabId) {
        try {
            const data = await chrome.storage.local.get([
                'blockedStreamers', 
                'blockedKeywords', 
                'blockedCategories', 
                'settings'
            ]);
            
            chrome.tabs.sendMessage(tabId, {
                action: 'updateFilters',
                data: data
            }).catch(() => {
                // Content script henüz yüklenmemiş olabilir, sessizce geç
            });
        } catch (error) {
            console.error('Tab\'a filtre gönderme hatası:', error);
        }
    }
    
    setupStorageListener() {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local') {
                // Storage değişikliklerini logla
                Object.keys(changes).forEach(key => {
                    const change = changes[key];
                    console.log(`Storage değişikliği - ${key}:`, {
                        oldValue: change.oldValue,
                        newValue: change.newValue
                    });
                });
                
                // Aktif Kick.com sekmelerine güncellemeleri gönder
                this.broadcastToKickTabs(changes);
            }
        });
    }
    
    async broadcastToKickTabs(changes) {
        try {
            const tabs = await chrome.tabs.query({ url: 'https://kick.com/*' });
            
            const updateData = {};
            if (changes.blockedStreamers) updateData.blockedStreamers = changes.blockedStreamers.newValue;
            if (changes.blockedKeywords) updateData.blockedKeywords = changes.blockedKeywords.newValue;
            if (changes.blockedCategories) updateData.blockedCategories = changes.blockedCategories.newValue;
            if (changes.settings) updateData.settings = changes.settings.newValue;
            
            if (Object.keys(updateData).length > 0) {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'updateFilters',
                        data: updateData
                    }).catch(() => {
                        // Sessizce geç
                    });
                });
            }
        } catch (error) {
            console.error('Broadcast hatası:', error);
        }
    }
    
    setupContextMenus() {
        chrome.contextMenus.create({
            id: 'quickBlockStreamer',
            title: 'Bu yayıncıyı engelle',
            contexts: ['link'],
            targetUrlPatterns: ['https://kick.com/*']
        });
        
        chrome.contextMenus.create({
            id: 'openSettings',
            title: 'Yayıncı Engelle Ayarları',
            contexts: ['action']
        });
        
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });
    }
    
    async handleContextMenuClick(info, tab) {
        if (info.menuItemId === 'quickBlockStreamer') {
            await this.quickBlockFromContextMenu(info.linkUrl);
        } else if (info.menuItemId === 'openSettings') {
            chrome.action.openPopup();
        }
    }
    
    async quickBlockFromContextMenu(linkUrl) {
        try {
            const url = new URL(linkUrl);
            const pathParts = url.pathname.split('/').filter(part => part.length > 0);
            
            if (pathParts.length > 0) {
                const streamerName = pathParts[pathParts.length - 1].toLowerCase();
                
                const result = await chrome.storage.local.get('blockedStreamers');
                const blockedStreamers = result.blockedStreamers || [];
                
                if (!blockedStreamers.includes(streamerName)) {
                    blockedStreamers.push(streamerName);
                    await chrome.storage.local.set({ blockedStreamers });
                    
                    // Bildirim göster
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon48.png',
                        title: 'Yayıncı Engellendi',
                        message: `${streamerName} başarıyla engellendi!`
                    });
                }
            }
        } catch (error) {
            console.error('Context menu engelleme hatası:', error);
        }
    }
    
    // Utility fonksiyonları
    async getStats() {
        try {
            const data = await chrome.storage.local.get([
                'blockedStreamers', 
                'blockedKeywords', 
                'blockedCategories'
            ]);
            
            return {
                totalBlocked: (data.blockedStreamers || []).length + 
                             (data.blockedKeywords || []).length + 
                             (data.blockedCategories || []).length,
                streamersBlocked: (data.blockedStreamers || []).length,
                keywordsBlocked: (data.blockedKeywords || []).length,
                categoriesBlocked: (data.blockedCategories || []).length
            };
        } catch (error) {
            console.error('İstatistik alma hatası:', error);
            return {
                totalBlocked: 0,
                streamersBlocked: 0,
                keywordsBlocked: 0,
                categoriesBlocked: 0
            };
        }
    }
    
    async clearAllData() {
        try {
            await chrome.storage.local.clear();
            console.log('Tüm veriler temizlendi');
        } catch (error) {
            console.error('Veri temizleme hatası:', error);
        }
    }
}

// Service Worker başlatma
const backgroundService = new BackgroundService();

// Message listener for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getStats') {
        backgroundService.getStats().then(stats => {
            sendResponse(stats);
        });
        return true; // Async response
    }
    
    if (message.action === 'clearAllData') {
        backgroundService.clearAllData().then(() => {
            sendResponse({ success: true });
        });
        return true; // Async response
    }
});

// Alarm listener for periodic tasks (if needed)
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyCleanup') {
        // Günlük temizlik işlemleri
        console.log('Günlük temizlik çalıştırıldı');
    }
});

// Set up periodic alarms
chrome.alarms.create('dailyCleanup', {
    delayInMinutes: 1440, // 24 saat
    periodInMinutes: 1440
});

console.log('Yayıncı Engelle background service başlatıldı!');
