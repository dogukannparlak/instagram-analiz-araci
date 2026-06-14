#!/usr/bin/env python3
"""
Test script for Instagram Follower Analyzer
"""

import os
import shutil
import sys
import tempfile
import unittest

from instagram_parser import (
    detect_connection_type,
    difference,
    intersection,
    parse_export_directory,
    parse_export_file,
    parse_usernames,
    parse_usernames_with_formats,
)


class ParserTests(unittest.TestCase):
    def test_link_format_followers(self):
        with open("example_followers.html", encoding="utf-8") as file:
            html = file.read()
        usernames, formats = parse_usernames_with_formats(html)
        self.assertEqual(usernames, ["user1", "user2", "user3", "user4", "user5"])
        self.assertEqual(formats, ["link"])

    def test_link_and_h2_format_following(self):
        with open("example_following.html", encoding="utf-8") as file:
            html = file.read()
        usernames, formats = parse_usernames_with_formats(html)
        self.assertEqual(usernames, ["user1", "user2", "user6", "user7", "user8"])
        self.assertIn("link", formats)
        self.assertIn("h2", formats)

    def test_table_format(self):
        with open("example_table.html", encoding="utf-8") as file:
            html = file.read()
        usernames, formats = parse_usernames_with_formats(html)
        self.assertEqual(usernames, ["blocked_one", "blocked_two"])
        self.assertEqual(formats, ["table"])

    def test_empty_html(self):
        self.assertEqual(parse_usernames(""), [])
        self.assertEqual(parse_usernames("   "), [])

    def test_detect_connection_type(self):
        self.assertEqual(detect_connection_type("followers_1.html"), "followers")
        self.assertEqual(detect_connection_type("following.html"), "following")
        self.assertEqual(detect_connection_type("blocked_profiles.html"), "blocked")

    def test_set_operations(self):
        self.assertEqual(difference(["a", "b"], ["b", "c"]), ["a"])
        self.assertEqual(intersection(["a", "b"], ["b", "c"]), ["b"])


def check_requirements():
    print("\n🔧 Gereksinimler kontrolü:")
    print("-" * 30)

    try:
        from bs4 import BeautifulSoup  # noqa: F401
        print("✅ BeautifulSoup4 kurulu")
    except ImportError:
        print("❌ BeautifulSoup4 kurulu değil!")
        print("💡 Yüklemek için: pip install beautifulsoup4")
        return False

    required_files = [
        "instagram_parser.py",
        "takipçi.py",
        "takip.py",
        "takipetmeyen.py",
        "baglantilar.py",
        "example_followers.html",
        "example_following.html",
        "example_table.html",
    ]

    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file} mevcut")
        else:
            print(f"❌ {file} bulunamadı!")
            return False

    return True


def test_with_example_files():
    print("🧪 Instagram Takipçi Analiz Aracı Test Scripti")
    print("=" * 50)

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
        shutil.copy("example_followers.html", "followers_1.html")
        shutil.copy("example_following.html", "following.html")
        print("✅ Örnek dosyalar kopyalandı")

        print("\n🔍 Test 1: Takipçi analizi")
        print("-" * 30)
        os.system("python3 takipçi.py")

        print("\n🔍 Test 2: Takip edilenler analizi")
        print("-" * 30)
        os.system("python3 takip.py")

        print("\n🔍 Test 3: Geri takip etmeyenler analizi")
        print("-" * 30)
        os.system("python3 takipetmeyen.py")

        with tempfile.TemporaryDirectory() as temp_dir:
            shutil.copy("example_followers.html", os.path.join(temp_dir, "followers_1.html"))
            shutil.copy("example_following.html", os.path.join(temp_dir, "following.html"))
            shutil.copy("example_table.html", os.path.join(temp_dir, "blocked_profiles.html"))

            print("\n🔍 Test 4: Bağlantılar klasör analizi")
            print("-" * 30)
            os.system(f"python3 baglantilar.py --dir {temp_dir}")

        print("\n🎉 Tüm testler tamamlandı!")

    except Exception as e:
        print(f"❌ Test sırasında hata: {e}")

    finally:
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


def test_real_export_if_available():
    export_dir = os.environ.get("INSTAGRAM_EXPORT_DIR", "")
    if not export_dir or not os.path.isdir(export_dir):
        return

    print("\n🔍 Gerçek export doğrulaması")
    print("-" * 30)
    data = parse_export_directory(export_dir)
    expected = {
        "followers": 204,
        "following": 148,
        "removed_suggestions": 229,
        "blocked": 83,
        "close_friends": 60,
    }

    for connection_type, expected_count in expected.items():
        actual_count = len(data.get(connection_type, []))
        status = "✅" if actual_count == expected_count else "❌"
        print(f"{status} {connection_type}: {actual_count} (beklenen: {expected_count})")


if __name__ == "__main__":
    print("📊 Instagram Takipçi Analiz Aracı - Test Scripti")
    print("=" * 60)

    if not check_requirements():
        print("\n❌ Gereksinimler karşılanmadı!")
        sys.exit(1)

    print("\n🚀 Birim testleri başlatılıyor...")
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(ParserTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)

    if not result.wasSuccessful():
        sys.exit(1)

    print("\n🚀 CLI testleri başlatılıyor...")
    test_with_example_files()
    test_real_export_if_available()
