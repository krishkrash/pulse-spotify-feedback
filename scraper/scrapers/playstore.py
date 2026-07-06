import hashlib
from datetime import datetime

def scrape_playstore(limit=100):
    print("[Python Scraper] Scraping Play Store...")
    reviews_list = []
    app_id = "com.spotify.music"
    
    try:
        from google_play_scraper import Sort, reviews as gps_reviews
        
        result, _ = gps_reviews(
            app_id,
            lang='en',
            country='us',
            sort=Sort.NEWEST,
            count=limit
        )
        
        for r in result:
            try:
                review_id = r.get("reviewId")
                text = r.get("content", "")
                if not text:
                    continue
                    
                rating = r.get("score", 3)
                author = r.get("userName", "anonymous")
                upvotes = r.get("thumbsUpCount", 0)
                
                # Format date
                dt = r.get("at")
                if isinstance(dt, datetime):
                    date_str = dt.strftime("%Y-%m-%d")
                else:
                    date_str = datetime.utcnow().strftime("%Y-%m-%d")
                    
                if not review_id:
                    review_id = hashlib.sha256(f"play_store:{text}".encode("utf-8")).hexdigest()[:16]
                    
                reviews_list.append({
                    "id": review_id,
                    "source": "play_store",
                    "text": text,
                    "rating": rating,
                    "date": date_str,
                    "author": author,
                    "upvotes": upvotes,
                    "url": f"https://play.google.com/store/apps/details?id={app_id}"
                })
            except Exception as ex:
                print(f"[Play Store] Error parsing entry: {ex}")
                
    except Exception as e:
        print(f"[Play Store] Scraping failed or library not available: {e}")
        
    print(f"[Play Store] Scraping complete. Collected {len(reviews_list)} reviews.")
    return reviews_list
