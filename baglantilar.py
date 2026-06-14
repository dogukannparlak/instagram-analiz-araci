#!/usr/bin/env python3
import argparse
import os
import sys

from instagram_parser import (
    CONNECTION_LABELS,
    difference,
    intersection,
    parse_export_directory,
)


def print_section(title: str, users: list[str]) -> None:
    print(f"\n{title}")
    print("=" * 60)
    if not users:
        print("  (boş)")
        return
    for i, user in enumerate(users, 1):
        print(f"{i:3d}. {user}")
    print("=" * 60)
    print(f"Toplam: {len(users)}")


def run_analysis(directory: str) -> int:
    if not os.path.isdir(directory):
        print(f"❌ Hata: Klasör bulunamadı: {directory}")
        return 1

    html_files = [name for name in os.listdir(directory) if name.lower().endswith(".html")]
    if not html_files:
        print(f"❌ Hata: '{directory}' içinde HTML dosyası bulunamadı.")
        return 1

    data = parse_export_directory(directory)

    print("📊 Instagram Bağlantı Analizi")
    print("=" * 60)
    print(f"📁 Klasör: {directory}")
    print(f"📄 Dosya sayısı: {len(html_files)}")
    print("=" * 60)

    print("\n📋 Dosya Özetleri:")
    print("-" * 60)
    for connection_type in sorted(data.keys()):
        label = CONNECTION_LABELS.get(connection_type, connection_type)
        print(f"  {label:30} {len(data[connection_type]):4d} kullanıcı")

    followers = data.get("followers", [])
    following = data.get("following", [])
    blocked = data.get("blocked", [])
    close_friends = data.get("close_friends", [])
    pending_requests = data.get("pending_requests", [])
    recently_unfollowed = data.get("recently_unfollowed", [])

    if followers and following:
        not_following_back = difference(following, followers)
        mutual = intersection(following, followers)

        print("\n🔍 Temel Analiz (Takip / Takipçi)")
        print("=" * 60)
        print(f"Takip edilen: {len(following)}")
        print(f"Takipçi: {len(followers)}")
        print(f"Sizi takip etmeyen: {len(not_following_back)}")
        print(f"Karşılıklı takip: {len(mutual)}")
        if following:
            print(f"Karşılıklı takip oranı: {(len(mutual) / len(following)) * 100:.1f}%")

        print_section("❌ Sizi Takip Etmeyenler", not_following_back)

    if blocked and (followers or following):
        blocked_in_followers = intersection(blocked, followers)
        blocked_in_following = intersection(blocked, following)

        print("\n🚫 Engellenen Profil Çapraz Analizi")
        print("=" * 60)
        print(f"Engellenen takipçileriniz: {len(blocked_in_followers)}")
        print(f"Engellenen takip ettikleriniz: {len(blocked_in_following)}")
        print_section("Engellenen Takipçiler", blocked_in_followers)
        print_section("Engellenen Takip Edilenler", blocked_in_following)

    if close_friends and following:
        close_friends_not_following = difference(
            intersection(close_friends, following),
            followers,
        )
        print("\n⭐ Yakın Arkadaş Çapraz Analizi")
        print("=" * 60)
        print(f"Yakın arkadaş (geri takip etmeyen): {len(close_friends_not_following)}")
        print_section("Yakın Arkadaşlar - Sizi Takip Etmeyenler", close_friends_not_following)

    if pending_requests:
        print_section("⏳ Bekleyen Takip İstekleri", pending_requests)

    if recently_unfollowed and following:
        still_following = intersection(recently_unfollowed, following)
        print("\n↩️  Yakınlarda Takibi Bıraktıkların")
        print("=" * 60)
        print(f"Hâlâ takip ettiklerin: {len(still_following)}")
        print_section("Bıraktığın Halde Takip Ettiklerin", still_following)

    for connection_type in [
        "removed_suggestions",
        "recent_requests",
        "hide_story",
    ]:
        users = data.get(connection_type, [])
        if users:
            label = CONNECTION_LABELS.get(connection_type, connection_type)
            print_section(f"📌 {label}", users)

    print("\n✅ Analiz tamamlandı!")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Instagram export followers_and_following klasörünü analiz eder."
    )
    parser.add_argument(
        "--dir",
        default=".",
        help="Export HTML dosyalarının bulunduğu klasör (varsayılan: mevcut dizin)",
    )
    args = parser.parse_args()
    sys.exit(run_analysis(args.dir))


if __name__ == "__main__":
    main()
