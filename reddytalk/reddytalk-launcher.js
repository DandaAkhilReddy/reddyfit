#!/usr/bin/env node

/**
 * ReddyTalk AI - Unified Enhanced Tools Launcher
 * Integrates Claude Code, SST OpenCode, and Crawl4AI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ReddyTalkLauncher {
    constructor() {
        this.projectRoot = process.cwd();
        this.config = this.loadConfig();
    }

    loadConfig() {
        const configPath = path.join(this.projectRoot, 'enhanced-tools-config.json');
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        return { reddytalk_enhanced_tools: { tools: {} } };
    }

    async launch(tool = 'claude') {
        console.log('🎉 Welcome to ReddyTalk AI Enhanced Development Environment');
        console.log('🤖 Powered by Claude Code + SST OpenCode + Crawl4AI\n');

        switch (tool) {
            case 'claude':
            case 'code':
                await this.launchClaudeCode();
                break;
            case 'opencode':
            case 'open':
                await this.launchOpenCode();
                break;
            case 'crawl':
            case 'crawl4ai':
                await this.launchCrawl4AI();
                break;
            case 'test':
                await this.launchTesting();
                break;
            case 'all':
                await this.launchAll();
                break;
            default:
                this.showHelp();
        }
    }

    async launchClaudeCode() {
        console.log('🧠 Launching Enhanced Claude Code...');
        const claudePath = path.join(this.projectRoot, 'claude-code-enhanced.js');
        if (fs.existsSync(claudePath)) {
            execSync(`node "${claudePath}"`, { stdio: 'inherit' });
        } else {
            console.log('❌ Enhanced Claude Code not found');
        }
    }

    async launchOpenCode() {
        console.log('🚀 Launching SST OpenCode...');
        try {
            execSync('opencode', { stdio: 'inherit' });
        } catch (error) {
            console.log('⚠️  Global OpenCode not found, using local setup...');
            const localPath = path.join(this.projectRoot, 'tools', 'opencode', 'opencode.js');
            if (fs.existsSync(localPath)) {
                execSync(`node "${localPath}"`, { stdio: 'inherit' });
            } else {
                console.log('❌ OpenCode not available');
            }
        }
    }

    async launchCrawl4AI() {
        console.log('🕷️ Launching Crawl4AI Medical Research Crawler...');
        console.log('Available commands:');
        console.log('  - crawl <url>           Crawl specific medical website');
        console.log('  - research <query>      Search medical research databases'); 
        console.log('  - summary <content>     Generate AI summary of medical content');
    }

    async launchTesting() {
        console.log('🧪 Launching Interactive Testing Dashboard...');
        const testPath = path.join(this.projectRoot, 'interactive-ui.html');
        if (fs.existsSync(testPath)) {
            execSync(`start "" "${testPath}"`, { stdio: 'inherit' });
        } else {
            console.log('❌ Testing dashboard not found');
        }
    }

    async launchAll() {
        console.log('🎯 Launching complete ReddyTalk AI development environment...');
        
        // Start backend
        console.log('1. Starting backend server...');
        execSync('node test-backend-api.js', { stdio: 'ignore', detached: true });
        
        // Open testing UI
        console.log('2. Opening testing dashboard...');
        await this.launchTesting();
        
        // Launch Claude Code
        console.log('3. Starting Enhanced Claude Code...');
        await this.launchClaudeCode();
    }

    showHelp() {
        console.log(`
🎯 ReddyTalk AI Enhanced Tools Launcher

Usage: node reddytalk-launcher.js [tool]

Available Tools:
  claude, code    - Enhanced Claude Code with medical AI prompts
  opencode, open  - SST OpenCode terminal AI assistant  
  crawl, crawl4ai - Medical research web crawler
  test            - Interactive testing dashboard
  all             - Launch complete development environment

Examples:
  node reddytalk-launcher.js claude     # Launch Claude Code
  node reddytalk-launcher.js test       # Open testing interface
  node reddytalk-launcher.js all        # Start everything

🚀 Enhanced Features:
  ✅ GitHub system prompts integrated
  ✅ Medical AI conversation capabilities
  ✅ Social media automation (Xiaohongshu)
  ✅ Medical research web crawling
  ✅ Interactive testing dashboard
  ✅ Azure deployment ready
        `);
    }
}

if (require.main === module) {
    const launcher = new ReddyTalkLauncher();
    const tool = process.argv[2] || 'claude';
    launcher.launch(tool);
}

module.exports = ReddyTalkLauncher;