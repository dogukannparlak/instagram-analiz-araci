from bs4 import BeautifulSoup
import os
import sys

# HTML dosya yolunu belirtin
file_path = "followers_1.html"

try:
    # Dosyanın var olup olmadığını kontrol et
    if not os.path.exists(file_path):
        print(f"❌ Hata: '{file_path}' dosyası bulunamadı!")
        print("💡 İpucu: Instagram'dan verilerinizi indirip bu dosyayı proje klasörüne kopyalayın.")
        sys.exit(1)
    
    # Dosyayı aç ve içeriğini oku
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()
    
    # İçeriğin boş olup olmadığını kontrol et
    if not content.strip():
        print(f"❌ Hata: '{file_path}' dosyası boş!")
        sys.exit(1)
    
    # BeautifulSoup ile HTML'yi parse et
    soup = BeautifulSoup(content, "html.parser")
    
    # Kullanıcı adlarını bul (örneğin, 'a' etiketindeki metni çekiyoruz)
    usernames = [a.text.strip() for a in soup.find_all("a", href=True) if "instagram.com" in a["href"]]
    
    # Sonuçları kontrol et
    if not usernames:
        print("⚠️  Uyarı: Hiçbir takipçi bulunamadı!")
        print("💡 İpucu: HTML dosyasının formatı değişmiş olabilir.")
    else:
        print(f"📊 Toplam {len(usernames)} takipçi bulundu:\n")
        print("=" * 50)
        print("👥 TAKİPÇİLER:")
        print("=" * 50)
        for i, username in enumerate(usernames, 1):
            print(f"{i:3d}. {username}")
        print("=" * 50)
        print(f"✅ Analiz tamamlandı! Toplam: {len(usernames)} takipçi")

except FileNotFoundError:
    print(f"❌ Hata: '{file_path}' dosyası bulunamadı!")
    print("💡 İpucu: Instagram'dan verilerinizi indirip bu dosyayı proje klasörüne kopyalayın.")
except UnicodeDecodeError:
    print(f"❌ Hata: '{file_path}' dosyası okunurken kodlama hatası!")
    print("💡 İpucu: Dosyanın UTF-8 kodlamasında olduğundan emin olun.")
except Exception as e:
    print(f"❌ Beklenmeyen hata: {str(e)}")
    print("💡 İpucu: Dosyanın geçerli bir HTML dosyası olduğundan emin olun.")
