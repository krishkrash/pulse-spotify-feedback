import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import hashlib
import time
import random
from datetime import datetime


def _get_headers():
    ua_list = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    ]
    return {
        "User-Agent": random.choice(ua_list),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }


def _scrape_rss(session, limit):
    """Try to collect posts from the Spotify Community RSS feed."""
    reviews = []
    urls = [
        "https://community.spotify.com/t5/forums/recentpostspage/post-type/thread/feed-id/active-messages",
        "https://community.spotify.com/t5/forums/recentpostspage/feed-id/active-messages",
        "https://community.spotify.com/t5/Ongoing-Issues/bd-p/ongoing-issues/rss",
    ]
    for url in urls:
        try:
            resp = session.get(url, headers=_get_headers(), timeout=12)
            if resp.status_code != 200:
                continue

            soup = BeautifulSoup(resp.content, "xml")
            items = soup.find_all("item")
            if not items:
                continue

            for item in items:
                try:
                    title = item.find("title")
                    title_text = title.get_text(strip=True) if title else ""

                    desc = item.find("description")
                    desc_text = ""
                    if desc:
                        dsoup = BeautifulSoup(desc.get_text(), "html.parser")
                        desc_text = dsoup.get_text(strip=True)

                    text = f"{title_text} {desc_text}".strip()
                    if not text:
                        continue

                    link = item.find("link")
                    url_str = link.get_text(strip=True) if link else "https://community.spotify.com"

                    author = "community_user"
                    creator = item.find("creator") or item.find("dc:creator")
                    if creator:
                        author = creator.get_text(strip=True)

                    date_str = datetime.utcnow().strftime("%Y-%m-%d")
                    pub_date = item.find("pubDate")
                    if pub_date:
                        try:
                            raw = pub_date.get_text(strip=True)[:25].strip()
                            dt = datetime.strptime(raw, "%a, %d %b %Y %H:%M:%S")
                            date_str = dt.strftime("%Y-%m-%d")
                        except Exception:
                            pass

                    review_id = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
                    reviews.append({
                        "id": f"forum_{review_id}",
                        "source": "forum",
                        "text": text,
                        "rating": None,
                        "date": date_str,
                        "author": author,
                        "upvotes": 0,
                        "url": url_str,
                    })
                    if len(reviews) >= limit:
                        break
                except Exception:
                    pass

            if reviews:
                return reviews
        except Exception:
            pass

    return reviews


def _scrape_board_html(session, limit):
    """Fall back to scraping board HTML pages directly."""
    reviews = []
    boards = [
        "https://community.spotify.com/t5/Ongoing-Issues/bd-p/ongoing-issues",
        "https://community.spotify.com/t5/Closed-Ideas/bd-p/ClosedIdeas",
        "https://community.spotify.com/t5/Live-Ideas/bd-p/live-ideas",
    ]

    for board_url in boards:
        try:
            time.sleep(random.uniform(0.8, 1.5))
            resp = session.get(board_url, headers=_get_headers(), timeout=12)
            if resp.status_code != 200:
                continue

            soup = BeautifulSoup(resp.content, "html.parser")

            # Look for thread links — Khoros/Lithium platform uses lia-message-subject or similar
            thread_links = soup.find_all("a", class_=re.compile(r"lia-link|message-subject|thread", re.I)) if False else []

            # Generic: all h2/h3 links within li items
            for li in soup.find_all("li"):
                link_el = li.find("a", href=True)
                if not link_el:
                    continue
                href = link_el.get("href", "")
                if "/t5/" not in href:
                    continue
                title_text = link_el.get_text(strip=True)
                if len(title_text) < 10:
                    continue

                text = title_text
                full_url = href if href.startswith("http") else f"https://community.spotify.com{href}"
                review_id = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
                reviews.append({
                    "id": f"forum_{review_id}",
                    "source": "forum",
                    "text": text,
                    "rating": None,
                    "date": datetime.utcnow().strftime("%Y-%m-%d"),
                    "author": "community_user",
                    "upvotes": 0,
                    "url": full_url,
                })
                if len(reviews) >= limit:
                    break

            if reviews:
                break
        except Exception:
            pass

    return reviews


def scrape_community(limit=30):
    print("[Python Scraper] Scraping Spotify Community Forum...")
    session = requests.Session()

    # Strategy 1: RSS
    reviews = _scrape_rss(session, limit)
    if reviews:
        print(f"[Community] RSS scraping complete. Collected {len(reviews)} posts.")
        return reviews[:limit]

    # Strategy 2: HTML board pages
    print("[Community] RSS unavailable (403 or empty). Trying HTML board scraping...")
    try:
        import re
        reviews = _scrape_board_html(session, limit)
    except Exception as e:
        print(f"[Community] HTML board scraping failed: {e}")

    print(f"[Community] Scraping complete. Collected {len(reviews)} forum posts.")
    return reviews[:limit]
