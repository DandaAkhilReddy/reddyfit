// Enhanced Tool Integrations for ReddyTalk AI

    async runOpenCode() {
        console.log('🚀 Starting SST OpenCode integration...');
        
        const openCodePath = path.join(this.projectRoot, 'tools', 'opencode', 'opencode.js');
        if (fs.existsSync(openCodePath)) {
            const { spawn } = require('child_process');
            const process = spawn('node', [openCodePath], { stdio: 'inherit' });
            process.on('exit', () => console.log('✅ OpenCode session ended'));
        } else {
            console.log('⚠️  OpenCode not available, using enhanced Claude Code features');
        }
    }

    async runCrawl4AI(url, options = {}) {
        console.log(`🕷️ Starting Crawl4AI for: ${url}`);
        
        try {
            const Crawl4AIService = require('./src/services/crawl/Crawl4AIService');
            const crawler = new Crawl4AIService();
            
            await crawler.initialize();
            const result = await crawler.crawlMedicalContent(url, options);
            
            console.log('✅ Content crawled successfully:');
            console.log(`   Title: ${result.data?.title || 'N/A'}`);
            console.log(`   Content Length: ${result.data?.content?.length || 0} characters`);
            
            await crawler.cleanup();
            return result;
        } catch (error) {
            console.error('❌ Crawl4AI failed:', error.message);
        }
    }

module.exports = { runOpenCode, runCrawl4AI };