#!/usr/bin/env python3
"""
Test script for Instagram Follower Analyzer

Bu script örnek verilerle projeyi test eder.
"""

import os
import sys
import shutil

def test_with_example_files():
    """Örnek dosyalarla test yapar"""
    print("🧪 Instagram Takipçi Analiz Aracı Test Scripti")
    print("=" * 50)
    
    # Mevcut dosyaları yedekle
    backup_followers = None
    backup_following = None
    
    if os.path.exists("followers_1.html"):
        backup_followers = "followers_1.html.backup"
        shutil.copy("followers_1.html", backup_followers)
        print("📋 Mevcut followers_1.html yedeklendi")
    
    if os.path.exists("following.html"):
        backup_following = "following.html.backup"
        shutil.copy("following.html", backup_following)
        print("📋 Mevcut following.html yedeklendi")
    
    try:
        # Örnek dosyaları kopyala
        shutil.copy("example_followers.html", "followers_1.html")
        shutil.copy("example_following.html", "following.html")
        print("✅ Örnek dosyalar kopyalandı")
        
        print("\n🔍 Test 1: Takipçi analizi")
        print("-" * 30)
        os.system("python takipçi.py")
        
        print("\n🔍 Test 2: Takip edilenler analizi")
        print("-" * 30)
        os.system("python takip.py")
        
        print("\n🔍 Test 3: Geri takip etmeyenler analizi")
        print("-" * 30)
        os.system("python takipetmeyen.py")
        
        print("\n🎉 Tüm testler tamamlandı!")
        
    except Exception as e:
        print(f"❌ Test sırasında hata: {e}")
    
    finally:
        # Orijinal dosyaları geri yükle
        if backup_followers:
            shutil.move(backup_followers, "followers_1.html")
            print("🔄 Orijinal followers_1.html geri yüklendi")
        elif os.path.exists("followers_1.html"):
            os.remove("followers_1.html")
            print("🗑️  Test followers_1.html silindi")
        
        if backup_following:
            shutil.move(backup_following, "following.html")
            print("🔄 Orijinal following.html geri yüklendi")
        elif os.path.exists("following.html"):
            os.remove("following.html")
            print("🗑️  Test following.html silindi")

def check_requirements():
    """Gereksinimleri kontrol et"""
    print("\n🔧 Gereksinimler kontrolü:")
    print("-" * 30)
    
    try:
        from bs4 import BeautifulSoup
        print("✅ BeautifulSoup4 kurulu")
    except ImportError:
        print("❌ BeautifulSoup4 kurulu değil!")
        print("💡 Yüklemek için: pip install beautifulsoup4")
        return False
    
    required_files = [
        "takipçi.py",
        "takip.py", 
        "takipetmeyen.py",
        "example_followers.html",
        "example_following.html"
    ]
    
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file} mevcut")
        else:
            print(f"❌ {file} bulunamadı!")
            return False
    
    return True

if __name__ == "__main__":
    print("📊 Instagram Takipçi Analiz Aracı - Test Scripti")
    print("=" * 60)
    
    if check_requirements():
        print("\n🚀 Testler başlatılıyor...")
        test_with_example_files()
    else:
        print("\n❌ Gereksinimler karşılanmadı!")
        sys.exit(1)
