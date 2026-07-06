import requests
from bs4 import BeautifulSoup
import json
import re
import hashlib
import time
import random
from datetime import datetime


def _get_headers():
    """Rotate through realistic browser headers to avoid 403s."""
    ua_list = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    ]
    return {
        "User-Agent": random.choice(ua_list),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    }


def _parse_review_card(card):
    """Extract data from a single Trustpilot review <article> card."""
    # Rating
    rating = 3
    try:
        rating_img = card.find("img", alt=re.compile(r"Rated \d out of 5 stars", re.I))
        if rating_img:
            m = re.search(r"Rated (\d) out of 5 stars", rating_img.get("alt", ""), re.I)
            if m:
                rating = int(m.group(1))
        else:
            star_div = card.find("div", class_=re.compile(r"star-rating", re.I))
            if star_div:
                m = re.search(r"star-rating--(\d)", " ".join(star_div.get("class", [])))
                if m:
                    rating = int(m.group(1))
    except Exception:
        pass

    # Author
    author = "anonymous"
    try:
        a_el = card.find(attrs={"data-consumer-name-typography": "true"})
        if not a_el:
            a_el = card.find("span", class_=re.compile(r"consumer.*name|author", re.I))
        if a_el:
            author = a_el.get_text(strip=True)
    except Exception:
        pass

    # Title + body text
    title = ""
    try:
        t_el = card.find("h2", attrs={"data-review-title-typography": "true"})
        if not t_el:
            t_el = card.find("h2")
        if t_el:
            title = t_el.get_text(strip=True)
    except Exception:
        pass

    body = ""
    try:
        b_el = card.find("p", attrs={"data-review-text-typography": "true"})
        if not b_el:
            b_el = card.find("p", class_=re.compile(r"review.*text|text.*body", re.I))
        if b_el:
            body = b_el.get_text(strip=True)
    except Exception:
        pass

    text = f"{title} {body}".strip()
    if not text:
        return None

    # Date
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    try:
        time_el = card.find("time")
        if time_el and time_el.get("datetime"):
            date_str = time_el["datetime"].split("T")[0]
    except Exception:
        pass

    review_id = f"trustpilot_{hashlib.sha256(text.encode('utf-8')).hexdigest()[:16]}"

    return {
        "id": review_id,
        "source": "trustpilot",
        "text": text,
        "rating": rating,
        "date": date_str,
        "author": author,
        "upvotes": 0,
        "url": "https://www.trustpilot.com/review/www.spotify.com",
    }


def scrape_trustpilot(limit=30):
    print("[Python Scraper] Scraping Trustpilot...")
    reviews = []
    session = requests.Session()

    base_url = "https://www.trustpilot.com/review/www.spotify.com"
    page = 1

    while len(reviews) < limit:
        url = base_url if page == 1 else f"{base_url}?page={page}"
        try:
            time.sleep(random.uniform(1.0, 2.5))  # polite delay
            resp = session.get(url, headers=_get_headers(), timeout=15)

            if resp.status_code == 403:
                print(f"[Trustpilot] 403 on page {page} — Trustpilot is blocking automated requests. Skipping.")
                break
            if resp.status_code != 200:
                print(f"[Trustpilot] HTTP {resp.status_code} on page {page}. Stopping.")
                break

            soup = BeautifulSoup(resp.content, "html.parser")

            # Strategy 1: Parse __NEXT_DATA__ JSON (fastest, most complete)
            extracted_from_json = False
            next_script = soup.find("script", id="__NEXT_DATA__")
            if next_script and next_script.string:
                try:
                    data = json.loads(next_script.string)
                    props = data.get("props", {}).get("pageProps", {})
                    review_list = (
                        props.get("reviews")
                        or props.get("businessUnit", {}).get("reviews")
                        or []
                    )
                    for r in review_list:
                        try:
                            rev_text = f"{r.get('title', '')} {r.get('text', '')}".strip()
                            if not rev_text:
                                continue
                            consumer = r.get("consumer", {})
                            dates = r.get("dates", {})
                            pub = dates.get("publishedDate", "")
                            date_str = pub.split("T")[0] if pub else datetime.utcnow().strftime("%Y-%m-%d")
                            reviews.append({
                                "id": f"trustpilot_{r.get('id', hashlib.sha256(rev_text.encode()).hexdigest()[:16])}",
                                "source": "trustpilot",
                                "text": rev_text,
                                "rating": r.get("rating", 3),
                                "date": date_str,
                                "author": consumer.get("displayName", "anonymous"),
                                "upvotes": 0,
                                "url": base_url,
                            })
                            if len(reviews) >= limit:
                                break
                        except Exception:
                            pass
                    if review_list:
                        extracted_from_json = True
                except Exception as e:
                    print(f"[Trustpilot] __NEXT_DATA__ parse error: {e}")

            # Strategy 2: HTML <article> card parsing
            if not extracted_from_json:
                cards = soup.find_all("article")
                if not cards:
                    print(f"[Trustpilot] No review cards found on page {page}. Stopping.")
                    break
                for card in cards:
                    review = _parse_review_card(card)
                    if review:
                        reviews.append(review)
                    if len(reviews) >= limit:
                        break

            page += 1
            if page > 10:  # cap at 10 pages
                break

        except Exception as e:
            print(f"[Trustpilot] Request failed on page {page}: {e}")
            break

    print(f"[Trustpilot] Scraping complete. Collected {len(reviews)} reviews.")
    return reviews[:limit]
