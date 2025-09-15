#!/usr/bin/env python3

"""
Test Crawl4AI integration for ReddyTalk medical content
"""

import asyncio
from crawl4ai import AsyncWebCrawler
import json

async def test_medical_crawling():
    print("🕷️ Testing Crawl4AI for Medical Content Extraction")
    
    async with AsyncWebCrawler(verbose=True) as crawler:
        # Test crawling medical content
        test_urls = [
            "https://www.ncbi.nlm.nih.gov/pmc/",
            "https://www.who.int/health-topics",
            "https://medlineplus.gov"
        ]
        
        for url in test_urls:
            try:
                print(f"\n📄 Crawling: {url}")
                result = await crawler.arun(
                    url=url,
                    word_count_threshold=10,
                    extraction_strategy="LLMExtractionStrategy",
                    instruction="Extract medical information, health topics, and key medical facts"
                )
                
                print(f"✅ Success: {len(result.cleaned_html)} chars extracted")
                print(f"📊 Title: {result.metadata.get('title', 'N/A')}")
                
                # Save sample result
                if result.extracted_content:
                    print(f"🧠 AI Extracted Content: {result.extracted_content[:200]}...")
                    
            except Exception as e:
                print(f"❌ Error crawling {url}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_medical_crawling())