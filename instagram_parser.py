import os
import re
from dataclasses import dataclass, field
from typing import Optional

from bs4 import BeautifulSoup

INSTAGRAM_HREF_RE = re.compile(r"instagram\.com/(?:_u/)?([^/?#]+)", re.IGNORECASE)
VALID_USERNAME_RE = re.compile(r"^[a-zA-Z0-9._]{1,30}$")
RESERVED_INSTAGRAM_PATHS = {
    "p",
    "reel",
    "reels",
    "stories",
    "explore",
    "accounts",
    "about",
    "legal",
    "direct",
    "nametag",
    "_u",
}
USERNAME_LABELS = {"Kullanıcı adı", "Username"}

EXPORT_DATA_ACCURACY_WARNING = (
    "Instagram'ın dışa aktardığı verilerde silinmiş, kapatılmış veya artık mevcut olmayan "
    "hesaplar da yer alabilir. Bu listedeki kullanıcı adları ve sayılar, Instagram uygulamasındaki "
    "güncel durumla tam olarak örtüşmeyebilir."
)


def print_export_data_accuracy_warning() -> None:
    print(f"ℹ️  {EXPORT_DATA_ACCURACY_WARNING}\n")

FILENAME_TYPE_MAP = {
    "followers.html": "followers",
    "following.html": "following",
    "blocked_profiles.html": "blocked",
    "close_friends.html": "close_friends",
    "removed_suggestions.html": "removed_suggestions",
    "pending_follow_requests.html": "pending_requests",
    "recent_follow_requests.html": "recent_requests",
    "recently_unfollowed_profiles.html": "recently_unfollowed",
    "hide_story_from.html": "hide_story",
}

TITLE_TYPE_MAP = {
    "takipçiler": "followers",
    "followers": "followers",
    "takip edilenler": "following",
    "following": "following",
    "engellenen profiller": "blocked",
    "blocked profiles": "blocked",
    "yakın arkadaşlar": "close_friends",
    "close friends": "close_friends",
    "kaldırılan öneriler": "removed_suggestions",
    "removed suggestions": "removed_suggestions",
    "bekleyen takip istekleri": "pending_requests",
    "pending follow requests": "pending_requests",
    "yakınlardaki takip istekleri": "recent_requests",
    "recent follow requests": "recent_requests",
    "yakınlarda takibi bıraktığın profiller": "recently_unfollowed",
    "recently unfollowed profiles": "recently_unfollowed",
    "hikayeyi gizle": "hide_story",
    "hide story from": "hide_story",
}

CONNECTION_LABELS = {
    "followers": "Takipçiler",
    "following": "Takip Edilenler",
    "blocked": "Engellenen Profiller",
    "close_friends": "Yakın Arkadaşlar",
    "removed_suggestions": "Kaldırılan Öneriler",
    "pending_requests": "Bekleyen Takip İstekleri",
    "recent_requests": "Yakınlardaki Takip İstekleri",
    "recently_unfollowed": "Yakınlarda Takibi Bıraktıkların",
    "hide_story": "Hikayeyi Gizle",
    "unknown": "Bilinmeyen",
}


@dataclass
class ParseResult:
    connection_type: str
    usernames: list[str]
    source_formats: list[str] = field(default_factory=list)
    count: int = 0
    filename: str = ""

    def __post_init__(self):
        self.count = len(self.usernames)


def normalize_username(raw: str) -> Optional[str]:
    if not raw:
        return None

    username = raw.strip().lstrip("@")
    if not username or username.lower() in RESERVED_INSTAGRAM_PATHS:
        return None
    if not VALID_USERNAME_RE.match(username):
        return None
    return username


def username_from_href(href: str) -> Optional[str]:
    match = INSTAGRAM_HREF_RE.search(href)
    if not match:
        return None
    return normalize_username(match.group(1))


def _dedupe_preserve_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        normalized = normalize_username(item)
        if not normalized:
            continue
        key = normalized.lower()
        if key not in seen:
            seen.add(key)
            result.append(normalized)
    return result


def _extract_from_links(soup: BeautifulSoup) -> list[str]:
    usernames: list[str] = []
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        if "instagram.com" not in href:
            continue

        href_username = username_from_href(href)
        text_username = normalize_username(anchor.get_text(strip=True))

        if href_username:
            usernames.append(href_username)
        elif text_username:
            usernames.append(text_username)
    return usernames


def _extract_from_h2(soup: BeautifulSoup) -> list[str]:
    usernames: list[str] = []
    for heading in soup.find_all("h2"):
        classes = heading.get("class") or []
        if not any("_a6-i" in cls for cls in classes):
            continue
        username = normalize_username(heading.get_text(strip=True))
        if username:
            usernames.append(username)
    return usernames


def _extract_from_tables(soup: BeautifulSoup) -> list[str]:
    usernames: list[str] = []
    for row in soup.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue
        label = cells[0].get_text(strip=True)
        if label not in USERNAME_LABELS:
            continue
        username = normalize_username(cells[1].get_text(strip=True))
        if username:
            usernames.append(username)
    return usernames


def parse_usernames(html: str) -> list[str]:
    if not html or not html.strip():
        return []

    soup = BeautifulSoup(html, "html.parser")
    collected: list[str] = []

    for extractor in (_extract_from_links, _extract_from_h2, _extract_from_tables):
        collected.extend(extractor(soup))

    return _dedupe_preserve_order(collected)


def parse_usernames_with_formats(html: str) -> tuple[list[str], list[str]]:
    if not html or not html.strip():
        return [], []

    soup = BeautifulSoup(html, "html.parser")
    collected: list[str] = []
    source_formats: list[str] = []

    link_users = _extract_from_links(soup)
    if link_users:
        collected.extend(link_users)
        source_formats.append("link")

    h2_users = _extract_from_h2(soup)
    if h2_users:
        collected.extend(h2_users)
        source_formats.append("h2")

    table_users = _extract_from_tables(soup)
    if table_users:
        collected.extend(table_users)
        source_formats.append("table")

    return _dedupe_preserve_order(collected), source_formats


def detect_connection_type(filename: str, html: str = "") -> str:
    basename = os.path.basename(filename).lower()

    if basename.startswith("followers") and basename.endswith(".html"):
        return "followers"

    if basename in FILENAME_TYPE_MAP:
        return FILENAME_TYPE_MAP[basename]

    if html:
        soup = BeautifulSoup(html, "html.parser")
        title = soup.title.get_text(strip=True).lower() if soup.title else ""
        for key, connection_type in TITLE_TYPE_MAP.items():
            if key in title:
                return connection_type

    return "unknown"


def read_html_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as file:
        return file.read()


def parse_export_file(path: str) -> ParseResult:
    content = read_html_file(path)
    usernames, source_formats = parse_usernames_with_formats(content)
    connection_type = detect_connection_type(path, content)

    return ParseResult(
        connection_type=connection_type,
        usernames=usernames,
        source_formats=source_formats,
        filename=os.path.basename(path),
    )


def parse_export_directory(directory: str) -> dict[str, list[str]]:
    if not os.path.isdir(directory):
        raise FileNotFoundError(f"Klasör bulunamadı: {directory}")

    grouped: dict[str, list[str]] = {}

    for filename in sorted(os.listdir(directory)):
        if not filename.lower().endswith(".html"):
            continue

        path = os.path.join(directory, filename)
        result = parse_export_file(path)
        connection_type = result.connection_type

        if connection_type not in grouped:
            grouped[connection_type] = []

        grouped[connection_type].extend(result.usernames)

    for connection_type in grouped:
        grouped[connection_type] = _dedupe_preserve_order(grouped[connection_type])

    return grouped


def build_username_set(usernames: list[str]) -> set[str]:
    return {
        normalized.lower()
        for name in usernames
        if (normalized := normalize_username(name))
    }


def intersection(list_a: list[str], list_b: list[str]) -> list[str]:
    set_b = build_username_set(list_b)
    result: list[str] = []
    seen: set[str] = set()

    for name in list_a:
        normalized = normalize_username(name)
        if not normalized:
            continue
        key = normalized.lower()
        if key in set_b and key not in seen:
            seen.add(key)
            result.append(normalized)

    return result


def difference(list_a: list[str], list_b: list[str]) -> list[str]:
    set_b = build_username_set(list_b)
    result: list[str] = []
    seen: set[str] = set()

    for name in list_a:
        normalized = normalize_username(name)
        if not normalized:
            continue
        key = normalized.lower()
        if key not in set_b and key not in seen:
            seen.add(key)
            result.append(normalized)

    return result
