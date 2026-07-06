import os
import json
import argparse
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add the current directory to python path to resolve imports correctly when run from anywhere
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers.appstore import scrape_appstore
from scrapers.playstore import scrape_playstore
from scrapers.reddit import scrape_reddit
from scrapers.trustpilot import scrape_trustpilot
from scrapers.community import scrape_community

def main():
    parser = argparse.ArgumentParser(description="Multi-platform Spotify Review Scraper")
    parser.add_argument("--limit", type=int, default=100, help="Max reviews to scrape per platform")
    parser.add_argument("--dry-run", action="store_true", help="Run scrapers but don't save to file")
    args = parser.parse_args()

    print(f"🚀 Starting multi-platform Spotify review scraping (limit={args.limit} per platform)...")
    
    scrapers = {
        "app_store": lambda: scrape_appstore(limit=args.limit),
        "play_store": lambda: scrape_playstore(limit=args.limit),
        "reddit": lambda: scrape_reddit(limit=args.limit),
        "trustpilot": lambda: scrape_trustpilot(limit=args.limit),
        "forum": lambda: scrape_community(limit=args.limit)
    }

    all_reviews = []
    
    # Run scrapers concurrently
    with ThreadPoolExecutor(max_workers=len(scrapers)) as executor:
        futures = {executor.submit(func): name for name, func in scrapers.items()}
        for future in as_completed(futures):
            name = futures[future]
            try:
                result = future.result()
                all_reviews.extend(result)
                print(f"✅ {name} finished: collected {len(result)} reviews")
            except Exception as e:
                print(f"❌ {name} failed: {e}")

    # Deduplicate reviews by ID
    unique_reviews = {}
    for r in all_reviews:
        rid = r.get("id")
        if rid and rid not in unique_reviews:
            unique_reviews[rid] = r

    final_reviews = list(unique_reviews.values())
    print(f"\n📊 Scraping finished. Total unique reviews collected: {len(final_reviews)}")

    if args.dry_run:
        print("Dry run complete. No files saved.")
        return

    # Write output to reviews.json
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = os.path.join(output_dir, "reviews.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(final_reviews, f, indent=2, ensure_ascii=False)
        
    print(f"💾 Saved reviews to {output_file}")

if __name__ == "__main__":
    main()
