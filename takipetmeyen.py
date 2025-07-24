from bs4 import BeautifulSoup
import os
import sys

# HTML dosyalarını belirtin
following_file = "following.html"  # Takip edilenlerin dosyası
followers_file = "followers_1.html"  # Takipçilerin dosyası

try:
    # Dosyaların var olup olmadığını kontrol et
    if not os.path.exists(following_file):
        print(f"❌ Hata: '{following_file}' dosyası bulunamadı!")
        print("💡 İpucu: Instagram'dan verilerinizi indirip bu dosyayı proje klasörüne kopyalayın.")
        sys.exit(1)
    
    if not os.path.exists(followers_file):
        print(f"❌ Hata: '{followers_file}' dosyası bulunamadı!")
        print("💡 İpucu: Instagram'dan verilerinizi indirip bu dosyayı proje klasörüne kopyalayın.")
        sys.exit(1)
    
    # Takip edilenleri al
    with open(following_file, "r", encoding="utf-8") as file:
        following_content = file.read()
    
    if not following_content.strip():
        print(f"❌ Hata: '{following_file}' dosyası boş!")
        sys.exit(1)
    
    soup_following = BeautifulSoup(following_content, "html.parser")
    following_usernames = [a.text.strip() for a in soup_following.find_all("a", href=True) if "instagram.com" in a["href"]]
    
    # Takipçileri al
    with open(followers_file, "r", encoding="utf-8") as file:
        followers_content = file.read()
    
    if not followers_content.strip():
        print(f"❌ Hata: '{followers_file}' dosyası boş!")
        sys.exit(1)
    
    soup_followers = BeautifulSoup(followers_content, "html.parser")
    followers_usernames = [a.text.strip() for a in soup_followers.find_all("a", href=True) if "instagram.com" in a["href"]]
    
    # Veri kontrolü
    if not following_usernames:
        print("⚠️  Uyarı: Takip edilen kullanıcı bulunamadı!")
        print("💡 İpucu: HTML dosyasının formatı değişmiş olabilir.")
        sys.exit(1)
    
    if not followers_usernames:
        print("⚠️  Uyarı: Takipçi bulunamadı!")
        print("💡 İpucu: HTML dosyasının formatı değişmiş olabilir.")
        sys.exit(1)
    
    # Sizi takip etmeyenleri belirle
    not_following_back = [user for user in following_usernames if user not in followers_usernames]
    
    # Sonuçları yazdır
    print("📊 Analiz Sonuçları:")
    print("=" * 60)
    print(f"👤 Takip ettiğiniz kişi sayısı: {len(following_usernames)}")
    print(f"👥 Sizi takip eden kişi sayısı: {len(followers_usernames)}")
    print(f"❌ Sizi takip etmeyen kişi sayısı: {len(not_following_back)}")
    print("=" * 60)
    
    if not_following_back:
        print("\n🔍 SİZİ TAKİP ETMEYEN KULLANICILAR:")
        print("=" * 60)
        for i, user in enumerate(not_following_back, 1):
            print(f"{i:3d}. {user}")
        print("=" * 60)
        print(f"✅ Analiz tamamlandı! {len(not_following_back)} kişi sizi takip etmiyor.")
    else:
        print("\n🎉 Harika! Takip ettiğiniz herkes sizi de takip ediyor! 🎉")
    
    # Karşılıklı takip edişme oranı
    if len(following_usernames) > 0:
        mutual_rate = ((len(following_usernames) - len(not_following_back)) / len(following_usernames)) * 100
        print(f"\n📈 Karşılıklı takip oranı: {mutual_rate:.1f}%")

except FileNotFoundError as e:
    print(f"❌ Hata: Dosya bulunamadı - {str(e)}")
    print("💡 İpucu: Instagram'dan verilerinizi indirip dosyaları proje klasörüne kopyalayın.")
except UnicodeDecodeError:
    print("❌ Hata: Dosya okunurken kodlama hatası!")
    print("💡 İpucu: Dosyaların UTF-8 kodlamasında olduğundan emin olun.")
except Exception as e:
    print(f"❌ Beklenmeyen hata: {str(e)}")
    print("💡 İpucu: Dosyaların geçerli HTML dosyaları olduğundan emin olun.")
