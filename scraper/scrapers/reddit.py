import requests
from bs4 import BeautifulSoup
import hashlib
from datetime import datetime
import re

def scrape_reddit(limit=50):
    print("[Python Scraper] Scraping Reddit...")
    reviews = []
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    subreddits = ["spotify", "Music"]
    
    for sub in subreddits:
        if len(reviews) >= limit:
            break
            
        url = f"https://old.reddit.com/r/{sub}/new/"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"[Reddit] Failed to fetch r/{sub} HTML (status {response.status_code})")
                continue
                
            soup = BeautifulSoup(response.content, "html.parser")
            things = soup.find_all("div", class_="thing")
            
            for t in things:
                try:
                    # Ignore promoted posts/ads
                    if "promoted" in t.get("class", []):
                        continue
                        
                    title_a = t.find("a", class_="title")
                    title = title_a.text.strip() if title_a else ""
                    
                    # On old reddit listing page, selftext is sometimes in a div class="usertext-body"
                    selftext_div = t.find("div", class_="usertext-body")
                    selftext = selftext_div.text.strip() if selftext_div else ""
                    
                    text = f"{title} {selftext}".strip()
                    if not text:
                        continue
                        
                    # If scraping r/Music, ensure it actually mentions Spotify
                    if sub.lower() == "music" and "spotify" not in text.lower():
                        continue
                        
                    post_id = t.get("data-fullname", "")
                    if not post_id:
                        post_id = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
                        
                    author_a = t.find("a", class_="author")
                    author = author_a.text.strip() if author_a else "deleted"
                    
                    # Date
                    time_elem = t.find("time")
                    date_str = datetime.utcnow().strftime("%Y-%m-%d")
                    if time_elem and time_elem.get("datetime"):
                        date_str = time_elem["datetime"][:10]
                        
                    # Upvotes/Score
                    score_div = t.find("div", class_=re.compile(r"score"))
                    upvotes = 0
                    if score_div:
                        score_text = score_div.text.strip()
                        if score_text.isdigit():
                            upvotes = int(score_text)
                        elif score_text == "•" or not score_text:
                            upvotes = 1
                            
                    permalink_a = t.find("a", class_="comments")
                    url_str = permalink_a.get("href") if permalink_a else f"https://old.reddit.com/r/{sub}/"
                    
                    reviews.append({
                        "id": f"reddit_{post_id}",
                        "source": "reddit",
                        "text": text,
                        "rating": None,
                        "date": date_str,
                        "author": f"u/{author}",
                        "upvotes": upvotes,
                        "url": url_str
                    })
                    
                    if len(reviews) >= limit:
                        break
                except Exception as ex:
                    pass
        except Exception as e:
            print(f"[Reddit] Error scraping r/{sub}: {e}")
            
    print(f"[Reddit] Scraping complete. Collected {len(reviews)} posts.")
    return reviews
