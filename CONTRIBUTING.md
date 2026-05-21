# Katkıda Bulunma Rehberi

Bu projeye ilgi gösterdiğiniz için teşekkürler. Instagram Takipçi Analiz Aracı kişisel bir side project olarak başladı; küçük düzeltmelerden yeni özelliklere kadar her türlü katkıya açığım.

Başlamadan önce [README.md](README.md) dosyasını okumanızı öneririm — projenin ne yaptığını ve nasıl çalıştığını anlamanıza yardımcı olur.

---

## Nasıl Katkı Verebilirsiniz?

### 1. Issue açın

Bir bug bulduysanız, yeni bir özellik öneriyorsanız veya export formatı değişikliği fark ettiyseniz önce issue açın. Böylece aynı konuda iki kişi çalışmaz ve tartışma kaydı kalır.

Issue açarken mümkünse şunları ekleyin:
- Ne yapmaya çalıştığınız
- Ne beklediğiniz / ne oldu
- Python sürümünüz ve işletim sisteminiz
- Hata mesajı veya ekran görüntüsü

**Önemli:** Issue veya PR'da gerçek Instagram kullanıcı adlarınızı veya export dosyalarınızı paylaşmayın. Örnek veri için repodaki `example_followers.html` ve `example_following.html` dosyalarını kullanın.

### 2. Fork ve branch

```bash
git clone https://github.com/<kullanici-adiniz>/instagram-analiz-araci.git
cd instagram-analiz-araci
git checkout -b fix/parser-update
```

Branch adları için kısa ve açıklayıcı isimler tercih edin:
- `fix/bos-liste-hatasi`
- `feat/csv-export`
- `docs/readme-guncelleme`

### 3. Geliştirme ortamı

```bash
pip install -r requirements.txt
python test.py
```

Değişikliklerinizi test etmeden PR açmayın. CLI scriptlerini etkilediyseniz `python test.py` çalıştırın. Web arayüzünü değiştirdiyseniz:

```bash
python -m http.server 8000 --directory web
```

komutuyla yerel olarak kontrol edin.

### 4. Pull request açın

PR açarken:
- Ne değiştirdiğinizi kısaca açıklayın
- Hangi sorunu çözdüğünüzü veya hangi özelliği eklediğinizi belirtin
- Test adımlarını yazın ("`python test.py` çalıştırıldı, hata yok" gibi)

Tek odaklı PR'lar tercih edilir — bir PR'da hem parser düzeltmesi hem büyük UI refactor'u olması review'u zorlaştırır.

---

## Kod Stili

Mevcut kod tabanındaki convention'lara uyun:

**Python**
- Dosya başında gerekli import'lar
- Anlaşılır Türkçe hata mesajları (mevcut scriptlerdeki gibi)
- Gereksiz abstraction eklemeyin; basit ve okunabilir tutun

**JavaScript**
- `InstagramAnalyzer` sınıfı yapısına uygun kalın
- Event listener'ları mevcut `initializeEventListeners` pattern'ine ekleyin
- Tarayıcıda çalışan vanilla JS — framework eklemeyin

**Genel**
- Yorumları yalnızca karmaşık veya belirsiz mantık için yazın
- Kişisel Instagram verilerini repoya commit etmeyin (`.gitignore` bunu engeller)

---

## Davranış Kuralları

- Saygılı ve yapıcı iletişim
- Eleştiri kişisel değil, koda yönelik olsun
- Farklı deneyim seviyelerine sabırlı yaklaşım

Basit bir kural: bu repoda konuşur gibi konuşun.

---

## Ne Tür Katkılar Aranıyor?

- Instagram export format değişikliklerine uyum
- Hata düzeltmeleri ve edge case'ler
- Dokümantasyon iyileştirmeleri
- Web arayüzü UX düzeltmeleri
- CSV / JSON export gibi [yol haritasındaki](README.md#yol-haritası) özellikler

Büyük bir değişiklik planlıyorsanız (örneğin tamamen yeni bir modül), önce issue açıp fikrinizi paylaşmanız review sürecini hızlandırır.

---

## Lisans

Katkıda bulunarak, katkılarınızın projenin [MIT lisansı](LICENSE) kapsamında lisanslanmasını kabul etmiş olursunuz.

---

Sorularınız varsa issue üzerinden veya PR yorumlarında yazabilirsiniz. Tekrar teşekkürler.
