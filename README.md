# Instagram Takipçi Analiz Aracı 📊

Bu proje, Instagram takipçi ve takip edilenlerinizi analiz etmenizi sağlayan güvenli ve kullanıcı dostu bir araçtır. Instagram'dan indirdiğiniz HTML verilerinizi kullanarak takipçi analizleri yapabilirsiniz.

## 🌟 Özellikler

- **Takipçi Analizi**: Sizi takip eden kullanıcıların listesini görüntüleme
- **Takip Edilenler**: Takip ettiğiniz kullanıcıların listesini görüntüleme
- **Geri Takip Etmeyenler**: Sizi takip etmeyen kullanıcıları tespit etme
- **Modern Web Arayüzü**: Responsive ve kullanıcı dostu web arayüzü
- **Güvenli**: Verileriniz sadece yerel olarak işlenir, hiçbir yere gönderilmez
- **Tema Desteği**: Açık/koyu tema seçenekleri
-

## 🚀 Kurulum

### Gereksinimler

- Python 3.6 veya üzeri
- Git (projeyi klonlamak için)

### Kurulum Adımları

1. **Projeyi klonlayın:**
   ```bash
   git clone https://github.com/dogukannparlak/instagram-analiz-araci.git
   cd instagram-analiz-araci
   ```

2. **Güncellemeleri kontrol edin:**
   ```bash
   git pull origin main
   ```

3. **Gerekli kütüphaneleri yükleyin:**
 
   ```bash
   pip install -r requirements.txt
   ```

4. **Instagram verilerinizi edinin:**
   - Instagram uygulaması/web sitesi → Ayarlar → Gizlilik ve Güvenlik → Veri İndirme
   - HTML formatını seçin ve "Bağlantılar" kategorisini dahil edin
   - İndirilen ZIP dosyasından `followers_1.html` ve `following.html` dosyalarını proje klasörüne kopyalayın

## 📱 Kullanım

### 1. Komut Satırı Aracları

#### Takipçileri Görüntüleme
```bash
python takipçi.py
```

#### Takip Edilenleri Görüntüleme
```bash
python takip.py
```

#### Geri Takip Etmeyenleri Bulma
```bash
python takipetmeyen.py
```

### 2. Web Arayüzü

1. **Web sunucusunu başlatın:**
   ```bash
   python -m http.server 8000 --directory web
   ```

2. **Tarayıcınızda açın:**
   ```
   http://localhost:8000
   ```

3. **Instagram HTML dosyalarınızı yükleyin** ve analiz sonuçlarını görüntüleyin.

## 📁 Proje Yapısı

```
instagram-follower-analyzer/
├── README.md                 # Bu dosya
├── takip.py                 # Takip edilenleri listeler
├── takipçi.py               # Takipçileri listeler
├── takipetmeyen.py          # Geri takip etmeyenleri bulur
├── followers_1.html         # Instagram takipçi verileri (kullanıcı tarafından sağlanır)
├── following.html           # Instagram takip edilenler verileri (kullanıcı tarafından sağlanır)
└── web/                     # Web arayüzü dosyaları
    ├── index.html           # Ana sayfa
    ├── css/
    │   └── style.css        # Stillar
    └── js/
        └── script.js        # JavaScript işlevleri
```

## 🔧 Dosya Açıklamaları

### Python Scriptleri

- **`takipçi.py`**: `followers_1.html` dosyasını okur ve takipçilerinizi listeler
- **`takip.py`**: `following.html` dosyasını okur ve takip ettiklerinizi listeler
- **`takipetmeyen.py`**: İki listeyi karşılaştırır ve sizi takip etmeyen kullanıcıları bulur

### Web Arayüzü

- **`web/index.html`**: Responsive web arayüzü
- **`web/css/style.css`**: Modern glassmorphism tasarımı
- **`web/js/script.js`**: İnteraktif özellikler ve dosya işleme

## 🎨 Özellikler

### Web Arayüzü Özellikleri

- **Responsive Tasarım**: Mobil ve masaüstü cihazlarda mükemmel görünüm
- **Glassmorphism Efektleri**: Modern cam efektli tasarım
- **Tema Değiştirme**: Açık/koyu tema seçenekleri
- **Animasyonlar**: Smooth geçiş efektleri
- **Dosya Yükleme**: Drag & drop desteği ile kolay dosya yükleme
- **Sonuç Filtreleme**: Arama ve filtreleme özellikleri

### Güvenlik

- **Yerel İşleme**: Tüm veriler sadece tarayıcınızda/bilgisayarınızda işlenir
- **Veri Gönderimi Yok**: Hiçbir veri harici sunuculara gönderilmez
- **Gizlilik**: Instagram verileriniz tamamen güvende

## 🔒 Gizlilik ve Güvenlik

Bu araç tamamen yerel olarak çalışır ve verilerinizi hiçbir yere göndermez. Tüm analizler bilgisayarınızda/tarayıcınızda gerçekleşir.


## 🚨 Yasal Uyarı

Bu araç sadece kendi Instagram hesabınızın verilerini analiz etmek için tasarlanmıştır. Instagram'ın Kullanım Koşullarına uygun şekilde kullanın.

## 📝 Sürüm Notları

### v1.0.0
- İlk sürüm
- Temel takipçi analiz özellikleri
- Web arayüzü
- Glassmorphism tasarım

## 👨‍💻 Geliştirici

**Doğukan Parlak**
- GitHub: [dogukannparlak](https://github.com/dogukannparlak)
- LinkedIn: [Doğukan Parlak](https://linkedin.com/in/dogukannparlak)


## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasını kontrol edin.

---

⭐ **Bu proje size yardımcı olduysa, lütfen yıldız vermeyi unutmayın!**
