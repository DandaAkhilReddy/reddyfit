// Crawl4AI Service for ReddyTalk AI Medical Data Extraction
// Specialized for medical content scraping and AI processing

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class Crawl4AIService {
    constructor(config = {}) {
        this.config = {
            userAgent: 'ReddyTalk-AI-Medical-Crawler/1.0',
            timeout: config.timeout || 30000,
            headless: config.headless !== false,
            ...config
        };
        this.browser = null;
    }

    async initialize() {
        try {
            this.browser = await puppeteer.launch({
                headless: this.config.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            console.log('🕷️ Crawl4AI service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Crawl4AI:', error);
            throw error;
        }
    }

    async crawlMedicalContent(url, options = {}) {
        try {
            const page = await this.browser.newPage();
            await page.setUserAgent(this.config.userAgent);
            
            await page.goto(url, { waitUntil: 'networkidle0' });
            
            // Extract content optimized for medical AI
            const content = await page.evaluate(() => {
                // Remove scripts and styles
                const scripts = document.querySelectorAll('script, style');
                scripts.forEach(el => el.remove());
                
                // Focus on main content areas
                const contentSelectors = [
                    'main',
                    '[role="main"]',
                    '.content',
                    '.article',
                    '.post',
                    'article'
                ];
                
                let mainContent = '';
                for (const selector of contentSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        mainContent = element.innerText;
                        break;
                    }
                }
                
                return {
                    title: document.title,
                    content: mainContent || document.body.innerText,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                };
            });
            
            await page.close();
            
            return {
                success: true,
                data: content,
                extractedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Medical content crawling failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async extractMedicalResearch(query, sources = []) {
        const defaultSources = [
            'https://pubmed.ncbi.nlm.nih.gov',
            'https://www.ncbi.nlm.nih.gov',
            'https://www.nejm.org',
            'https://jamanetwork.com'
        ];
        
        const searchSources = sources.length > 0 ? sources : defaultSources;
        const results = [];
        
        for (const source of searchSources) {
            try {
                const searchUrl = this.buildSearchUrl(source, query);
                const result = await this.crawlMedicalContent(searchUrl);
                
                if (result.success) {
                    results.push({
                        source: source,
                        query: query,
                        ...result
                    });
                }
            } catch (error) {
                console.warn(`⚠️ Failed to search ${source}: ${error.message}`);
            }
        }
        
        return {
            query: query,
            results: results,
            totalFound: results.length,
            searchedAt: new Date().toISOString()
        };
    }

    buildSearchUrl(baseUrl, query) {
        const encodedQuery = encodeURIComponent(query);
        
        // Simple search URL builders for common medical sites
        const urlBuilders = {
            'pubmed.ncbi.nlm.nih.gov': `${baseUrl}/?term=${encodedQuery}`,
            'ncbi.nlm.nih.gov': `${baseUrl}/search/all/?term=${encodedQuery}`,
            'nejm.org': `${baseUrl}/search?q=${encodedQuery}`,
            'jamanetwork.com': `${baseUrl}/search/${encodedQuery}`
        };
        
        for (const [domain, builder] of Object.entries(urlBuilders)) {
            if (baseUrl.includes(domain)) {
                return builder;
            }
        }
        
        return `${baseUrl}/search?q=${encodedQuery}`;
    }

    async generateMedicalSummary(content, context = 'general') {
        // This would integrate with your AI services
        return {
            summary: `Medical content summary for: ${content.slice(0, 100)}...`,
            keyPoints: [
                'Key medical findings extracted',
                'Relevant research insights',
                'Clinical implications'
            ],
            medicalTerms: ['AI extracted medical terms'],
            context: context,
            generatedAt: new Date().toISOString()
        };
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Crawl4AI service cleaned up');
        }
    }
}

module.exports = Crawl4AIService;