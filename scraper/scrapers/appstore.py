import requests
import json
import re
import hashlib
import time
import random
from datetime import datetime
from bs4 import BeautifulSoup


def _get_headers():
    ua_list = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    ]
    return {
        "User-Agent": random.choice(ua_list),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }


def _parse_review_item(review_obj, country):
    """Parse a single review dict from the App Store serialized-server-data."""
    rev = review_obj.get("review", review_obj)  # handle nested or flat
    
    review_id = str(rev.get("id", ""))
    title = rev.get("title", "")
    contents = rev.get("contents", "")
    text = f"{title} {contents}".strip()
    if not text:
        return None
    
    rating = rev.get("rating", 3)
    author = rev.get("reviewerName", "anonymous")
    
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    raw_date = rev.get("date", "")
    if raw_date:
        try:
            date_str = raw_date.split("T")[0]
        except Exception:
            pass
    
    if not review_id:
        review_id = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
    
    return {
        "id": f"app_store_{review_id}",
        "source": "app_store",
        "text": text,
        "rating": rating,
        "date": date_str,
        "author": author,
        "upvotes": 0,
        "url": f"https://apps.apple.com/{country}/app/spotify-music/id324684580",
    }


def _scrape_page_server_data(session, country):
    """
    Scrape reviews from the App Store page's serialized-server-data JSON blob.
    Apple embeds this data for SSR — no API key or token required.
    Returns list of reviews.
    """
    url = f"https://apps.apple.com/{country}/app/spotify-music/id324684580"
    reviews = []
    try:
        time.sleep(random.uniform(0.5, 1.5))
        resp = session.get(url, headers=_get_headers(), timeout=15)
        if resp.status_code != 200:
            return reviews
        
        soup = BeautifulSoup(resp.content, "html.parser")
        script = soup.find("script", id="serialized-server-data")
        if not script or not script.string:
            return reviews
        
        data = json.loads(script.string)
        
        # Navigate to reviews in the server data structure
        shelf_mapping = (
            data.get("data", [{}])[0]
            .get("data", {})
            .get("shelfMapping", {})
        )
        
        # Try multiple possible shelf keys
        for key in ("allProductReviews", "userProductReviews", "popularReviews"):
            shelf = shelf_mapping.get(key, {})
            items = shelf.get("items", [])
            for item in items:
                parsed = _parse_review_item(item, country)
                if parsed:
                    reviews.append(parsed)
    
    except Exception as e:
        pass  # Non-fatal: try next country
    
    return reviews


def _scrape_rss_fallback(country, limit):
    """
    Legacy RSS feed fallback — kept for compatibility, though Apple has deprecated this.
    Still works occasionally for some regional storefronts.
    """
    reviews = {}
    app_id = "324684580"
    headers = {"User-Agent": "iTunes/12.9.4.102 (Macintosh; OS X 10.14.6) AppleWebKit/607.4.7"}
    
    for page in range(1, 11):
        if len(reviews) >= limit:
            break
        url = f"https://itunes.apple.com/{country}/rss/customerreviews/page={page}/id={app_id}/sortBy=mostRecent/json"
        try:
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code != 200:
                break
            data = r.json()
            entries = data.get("feed", {}).get("entry", [])
            if isinstance(entries, dict):
                entries = [entries]
            if not entries:
                break
            for entry in entries:
                if "im:rating" not in entry:
                    continue
                try:
                    rev_id = entry.get("id", {}).get("label", "")
                    author = entry.get("author", {}).get("name", {}).get("label", "anonymous")
                    rating = int(entry.get("im:rating", {}).get("label", 3))
                    title = entry.get("title", {}).get("label", "")
                    content = entry.get("content", {}).get("label", "")
                    text = f"{title} {content}".strip()
                    if not text or rev_id in reviews:
                        continue
                    date_str = datetime.utcnow().strftime("%Y-%m-%d")
                    if "updated" in entry:
                        try:
                            date_str = entry["updated"]["label"].split("T")[0]
                        except Exception:
                            pass
                    reviews[rev_id] = {
                        "id": f"app_store_{rev_id}" if rev_id else f"app_store_{hashlib.sha256(text.encode()).hexdigest()[:16]}",
                        "source": "app_store",
                        "text": text,
                        "rating": rating,
                        "date": date_str,
                        "author": author,
                        "upvotes": 0,
                        "url": f"https://apps.apple.com/{country}/app/spotify-music/id324684580",
                    }
                    if len(reviews) >= limit:
                        break
                except Exception:
                    pass
        except Exception:
            break
    
    return list(reviews.values())


def scrape_appstore(limit=100):
    print("[Python Scraper] Scraping App Store...")
    
    session = requests.Session()
    reviews_by_id = {}
    
    # Strategy 1: Parse serialized-server-data from each country's App Store page
    countries = ["us", "gb", "au", "ca", "in", "de", "fr", "nz"]
    for country in countries:
        if len(reviews_by_id) >= limit:
            break
        page_reviews = _scrape_page_server_data(session, country)
        for r in page_reviews:
            if r["id"] not in reviews_by_id:
                reviews_by_id[r["id"]] = r
    
    # Strategy 2: RSS fallback for additional reviews
    if len(reviews_by_id) < limit:
        for country in ["us", "gb", "au", "ca"]:
            if len(reviews_by_id) >= limit:
                break
            rss_reviews = _scrape_rss_fallback(country, limit - len(reviews_by_id))
            for r in rss_reviews:
                if r["id"] not in reviews_by_id:
                    reviews_by_id[r["id"]] = r
    
    result = list(reviews_by_id.values())[:limit]
    print(f"[App Store] Scraping complete. Collected {len(result)} reviews.")
    return result
