# 🚫 Yayıncı Engelle - Chrome Eklentisi

Kick.com'da istenmeyen yayıncıları engelleyen gelişmiş Chrome eklentisi.

## 📋 Özellikler

### 🎯 Temel Fonksiyonlar
- **Yayıncı Engelleme**: İstenmeyen yayıncıları adlarına göre engelle
- **Anahtar Kelime Filtresi**: Başlıklarda belirli kelimeleri engelle
- **Kategori Filtresi**: Belirli oyun/kategori yayınlarını engelle
- **Hızlı Engelleme**: Hover'da çıkan butonla anlık engelleme

### 🎨 Görsel Özellikler
- **Modern UI**: Kick.com'a uyumlu koyu tema
- **Animasyonlar**: Yumuşak geçiş efektleri
- **Blur Mod**: Engellenen yayınları bulanıklaştır
- **Responsive**: Mobil uyumlu tasarım

### ⚙️ Gelişmiş Ayarlar
- **Sessiz Mod**: Bildirimleri kapat
- **Export/Import**: Ayarları yedekle ve geri yükle
- **İstatistikler**: Engellenen içerik sayısı
- **Geri Alma**: Yanlış engellenen yayıncıları geri çıkar

## 🚀 Kurulum

### Chrome Web Store'dan (Henüz Yayınlanmadı)
1. Chrome Web Store'da "Yayıncı Engelle" ara
2. "Chrome'a Ekle" butonuna tıkla
3. İzinleri onayla

### Manuel Kurulum (Geliştirici Modu)
1. Chrome'da `chrome://extensions/` adresine git
2. Sağ üst köşeden "Geliştirici modu"nu aktif et
3. "Paketlenmemiş öğe yükle" butonuna tıkla
4. Bu klasörü seç
5. Eklenti aktif hale gelecek

## 📖 Kullanım

### İlk Kurulum
1. Eklentiyi kurduktan sonra Chrome'un sağ üst köşesinde 🚫 ikonunu göreceksin
2. İkona tıklayarak ayarlar panelini aç
3. İlk yayıncı adını gir ve "Engelle" butonuna tıkla

### Yayıncı Engelleme
- **Manuel**: Popup'ta yayıncı adını yaz ve "Engelle" butonuna tıkla
- **Hızlı**: Yayın kartının üzerine geldiğinde çıkan 🚫 butonuna tıkla
- **Sağ Tık**: Yayıncı linkine sağ tıklayıp "Bu yayıncıyı engelle" seç

### Anahtar Kelime Engelleme
1. Popup'ta "Anahtar Kelime Engelleme" bölümüne git
2. Engellemek istediğin kelimeyi yaz (örn: "çekiliş", "futbol")
3. "Ekle" butonuna tıkla

### Kategori Engelleme
1. "Kategori Filtreleri" bölümünde istediğin kategorileri seç
2. Seçilen kategorilerdeki tüm yayınlar engellenir

## 🎛️ Ayarlar

### Sessiz Mod
- Engelleme bildirimleri gösterilmez
- Arka planda sessizce çalışır

### Blur Mod
- Engellenen yayınlar tamamen silinmez
- Bulanıklaştırılır ve üzerine "Engellendi" yazısı gelir

### Export/Import
- Ayarlarını JSON dosyası olarak dışa aktar
- Başka cihazlarda veya yeniden kurulumda içe aktar

## 🔧 Teknik Detaylar

### Dosya Yapısı
```
Yayıncı Engelle/
├── manifest.json          # Eklenti konfigürasyonu
├── popup.html             # Popup arayüzü
├── popup.css              # Popup stilleri
├── popup.js               # Popup JavaScript
├── content.js             # Sayfa içi script
├── content.css            # Sayfa içi stiller
├── background.js          # Arka plan servisi
├── icons/                 # Eklenti ikonları
└── README.md              # Bu dosya
```

### Kullanılan Teknolojiler
- **Manifest V3**: En güncel Chrome eklenti standardı
- **Vanilla JavaScript**: Framework bağımlılığı yok
- **CSS3**: Modern animasyonlar ve stiller
- **Chrome Storage API**: Yerel veri saklama
- **MutationObserver**: Dinamik içerik takibi

### Desteklenen Tarayıcılar
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave
- ✅ Opera

## 🐛 Sorun Giderme

### Eklenti Çalışmıyor
1. Chrome'u yeniden başlat
2. Eklentiyi devre dışı bırak ve tekrar aktif et
3. Kick.com sayfasını yenile

### Yayıncılar Engellenmiyor
1. Popup'ta yayıncı adının doğru yazıldığından emin ol
2. Sayfayı yenile
3. Tarayıcı konsolunu kontrol et (F12)

### Performans Sorunları
1. Çok fazla anahtar kelime engelleme kullanma
2. Blur mod yerine normal mod kullan
3. Gereksiz engellenen yayıncıları temizle

## 📊 İstatistikler

Popup'un alt kısmında şu bilgileri görebilirsin:
- Toplam engellenen yayıncı sayısı
- Aktif filtre sayısı
- Motivasyon mesajları

## 🔄 Güncelleme Geçmişi

### v1.0.0 (İlk Sürüm)
- Temel yayıncı engelleme
- Anahtar kelime filtresi
- Kategori filtresi
- Modern popup arayüzü
- Hızlı engelleme butonu
- Export/Import özelliği

## 🤝 Katkıda Bulunma

Bu proje açık kaynak değildir, ancak geri bildirimlerinizi memnuniyetle karşılarız!

### Özellik İstekleri
- GitHub Issues kullanarak özellik isteğinde bulun
- Detaylı açıklama ve kullanım senaryosu ekle

### Hata Bildirimi
- Hangi tarayıcı ve versiyonu kullandığını belirt
- Hatanın nasıl oluştuğunu adım adım açıkla
- Konsol hatalarını ekle

## 📜 Lisans

Bu proje kişisel kullanım için geliştirilmiştir.

---

**🎉 Temiz Kick.com deneyimi için teşekkürler!**

*"Bugün de kanserden korundun, iyi iş ✌️"*
