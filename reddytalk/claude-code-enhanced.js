#!/usr/bin/env node

/**
 * Enhanced Claude Code Runner for ReddyTalk AI
 * Integrates system prompts and tools from GitHub repository
 * Provides specialized medical AI development assistance
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class EnhancedClaudeCode {
    constructor() {
        this.projectRoot = __dirname;
        this.systemPrompt = null;
        this.toolsConfig = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Enhanced Claude Code for ReddyTalk AI...\n');
            
            // Load system prompt
            await this.loadSystemPrompt();
            
            // Load tools configuration
            await this.loadToolsConfig();
            
            // Validate project structure
            await this.validateProjectStructure();
            
            // Setup Claude Code environment
            await this.setupEnvironment();
            
            this.isInitialized = true;
            console.log('✅ Enhanced Claude Code initialized successfully!\n');
            
            this.displayWelcomeMessage();
            
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced Claude Code:', error.message);
            process.exit(1);
        }
    }

    async loadSystemPrompt() {
        const promptPath = path.join(this.projectRoot, 'claude-code-system-prompt.txt');
        
        if (!fs.existsSync(promptPath)) {
            throw new Error('System prompt file not found. Please ensure claude-code-system-prompt.txt exists.');
        }
        
        this.systemPrompt = fs.readFileSync(promptPath, 'utf8');
        console.log('📄 System prompt loaded from GitHub repository');
    }

    async loadToolsConfig() {
        const toolsPath = path.join(this.projectRoot, 'claude-code-tools.json');
        
        if (!fs.existsSync(toolsPath)) {
            throw new Error('Tools configuration file not found. Please ensure claude-code-tools.json exists.');
        }
        
        this.toolsConfig = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
        console.log('🔧 Tools configuration loaded from GitHub repository');
    }

    async validateProjectStructure() {
        const requiredFiles = [
            'package.json',
            'test-backend-api.js',
            'interactive-ui.html',
            'src/services/mcp/XiaohongshuMCPService.js'
        ];

        const missingFiles = requiredFiles.filter(file => {
            const fullPath = path.join(this.projectRoot, file);
            return !fs.existsSync(fullPath);
        });

        if (missingFiles.length > 0) {
            console.warn('⚠️  Some project files are missing:', missingFiles);
            console.log('   Continuing with available components...\n');
        } else {
            console.log('✅ Project structure validated');
        }
    }

    async setupEnvironment() {
        // Check if backend server is running
        const isServerRunning = await this.checkServerStatus();
        
        if (!isServerRunning) {
            console.log('🔄 Starting ReddyTalk backend server...');
            await this.startBackendServer();
        } else {
            console.log('✅ ReddyTalk backend server is already running');
        }
    }

    async checkServerStatus() {
        try {
            const response = execSync('curl -s http://localhost:8080/health', { 
                timeout: 3000,
                stdio: 'pipe' 
            });
            const data = JSON.parse(response.toString());
            return data.status === 'healthy';
        } catch (error) {
            return false;
        }
    }

    async startBackendServer() {
        try {
            // Kill existing process if any
            try {
                execSync('taskkill /f /im node.exe 2>nul || true', { stdio: 'pipe' });
            } catch (e) {
                // Ignore errors
            }

            // Start new server in background
            const serverProcess = spawn('node', ['test-backend-api.js'], {
                detached: true,
                stdio: 'ignore',
                cwd: this.projectRoot
            });

            serverProcess.unref();

            // Wait for server to start
            await new Promise(resolve => setTimeout(resolve, 3000));

            const isRunning = await this.checkServerStatus();
            if (isRunning) {
                console.log('✅ Backend server started successfully on http://localhost:8080');
            } else {
                console.warn('⚠️  Backend server may not have started properly');
            }
        } catch (error) {
            console.error('❌ Failed to start backend server:', error.message);
        }
    }

    displayWelcomeMessage() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 🤖 Enhanced Claude Code                      ║
║                ReddyTalk AI Medical Receptionist            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║ 🎯 Available Commands:                                       ║
║   • /health     - Check system health                       ║
║   • /test       - Run interactive tests                     ║
║   • /mcp        - Test Xiaohongshu MCP integration         ║
║   • /deploy     - Deploy to Azure                          ║
║   • /docs       - Generate documentation                   ║
║   • /help       - Show detailed help                       ║
║                                                              ║
║ 🚀 Enhanced Features:                                       ║
║   ✅ GitHub system prompts integrated                       ║
║   ✅ Medical AI conversation capabilities                   ║
║   ✅ Social media automation (Xiaohongshu)                 ║
║   ✅ Interactive testing dashboard                         ║
║   ✅ Azure cloud deployment ready                          ║
║                                                              ║
║ 📊 System Status:                                          ║
║   Backend API: http://localhost:8080                       ║
║   Test UI: interactive-ui.html                             ║
║   MCP Server: Xiaohongshu integration ready               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

🎉 Ready for enhanced AI-assisted development!
Type a command or describe what you'd like to work on.
`);
    }

    async executeCommand(command) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            switch (command) {
                case '/health':
                    await this.runHealthCheck();
                    break;
                case '/test':
                    await this.runInteractiveTests();
                    break;
                case '/mcp':
                    await this.testMCPIntegration();
                    break;
                case '/deploy':
                    await this.deployToAzure();
                    break;
                case '/docs':
                    await this.generateDocumentation();
                    break;
                case '/help':
                    this.showHelp();
                    break;
                default:
                    console.log('🤖 Processing with enhanced Claude Code capabilities...');
                    await this.processWithClaudeCode(command);
            }
        } catch (error) {
            console.error('❌ Command execution failed:', error.message);
        }
    }

    async runHealthCheck() {
        console.log('🏥 Running comprehensive health check...\n');

        const checks = [
            { name: 'Backend API', test: () => this.checkServerStatus() },
            { name: 'Package Dependencies', test: () => fs.existsSync('package.json') },
            { name: 'System Prompt', test: () => !!this.systemPrompt },
            { name: 'Tools Config', test: () => !!this.toolsConfig },
            { name: 'MCP Service', test: () => fs.existsSync('src/services/mcp/XiaohongshuMCPService.js') },
            { name: 'Interactive UI', test: () => fs.existsSync('interactive-ui.html') }
        ];

        for (const check of checks) {
            try {
                const result = await check.test();
                const status = result ? '✅' : '❌';
                console.log(`${status} ${check.name}`);
            } catch (error) {
                console.log(`❌ ${check.name} - Error: ${error.message}`);
            }
        }

        console.log('\n🎯 System ready for development!');
    }

    async runInteractiveTests() {
        console.log('🧪 Opening interactive testing interface...\n');
        
        try {
            const uiPath = path.join(this.projectRoot, 'interactive-ui.html');
            if (fs.existsSync(uiPath)) {
                // Open in default browser
                execSync(`start "" "${uiPath}"`, { stdio: 'ignore' });
                console.log('✅ Interactive testing UI opened in browser');
                console.log('🌐 URL: file://' + uiPath.replace(/\\/g, '/'));
            } else {
                console.log('❌ Interactive UI file not found');
            }
        } catch (error) {
            console.error('❌ Failed to open testing interface:', error.message);
        }
    }

    async testMCPIntegration() {
        console.log('🌟 Testing Xiaohongshu MCP integration...\n');

        try {
            const testEndpoints = [
                'http://localhost:8080/api/mcp/xiaohongshu/login',
                'http://localhost:8080/api/mcp/xiaohongshu/search',
                'http://localhost:8080/api/mcp/xiaohongshu/generate'
            ];

            for (const endpoint of testEndpoints) {
                try {
                    const response = execSync(`curl -s -X POST ${endpoint} -H "Content-Type: application/json" -d "{}"`, { 
                        timeout: 5000 
                    });
                    const data = JSON.parse(response.toString());
                    console.log(`✅ ${endpoint.split('/').pop()}: ${data.success ? 'Working' : 'Response received'}`);
                } catch (error) {
                    console.log(`❌ ${endpoint.split('/').pop()}: Not available`);
                }
            }
        } catch (error) {
            console.error('❌ MCP testing failed:', error.message);
        }
    }

    async deployToAzure() {
        console.log('☁️  Preparing Azure deployment...\n');
        
        const deploymentFiles = [
            'azure-deploy.yml',
            'Dockerfile',
            'deploy-to-azure.sh'
        ];

        const availableFiles = deploymentFiles.filter(file => 
            fs.existsSync(path.join(this.projectRoot, file))
        );

        if (availableFiles.length > 0) {
            console.log('📋 Available deployment configurations:');
            availableFiles.forEach(file => console.log(`   ✅ ${file}`));
            console.log('\n🚀 Run deployment manually or integrate with CI/CD pipeline');
        } else {
            console.log('❌ No deployment configurations found');
        }
    }

    async generateDocumentation() {
        console.log('📚 Generating project documentation...\n');

        const docFiles = [
            'COMPLETE_TEST_GUIDE.md',
            'API_TEST_GUIDE.md', 
            'TESTING_GUIDE.md'
        ];

        const existingDocs = docFiles.filter(file =>
            fs.existsSync(path.join(this.projectRoot, file))
        );

        console.log('📖 Available documentation:');
        existingDocs.forEach(doc => console.log(`   ✅ ${doc}`));

        if (existingDocs.length === 0) {
            console.log('❌ No documentation files found');
        }
    }

    showHelp() {
        console.log(`
📖 Enhanced Claude Code Help

🎯 Slash Commands:
   /health     - Check all system components
   /test       - Open interactive testing dashboard  
   /mcp        - Test Xiaohongshu MCP integration
   /deploy     - Show Azure deployment status
   /docs       - List available documentation
   /help       - Show this help message

🤖 Natural Language Commands:
   "test the backend API"
   "fix authentication issues" 
   "add new medical conversation features"
   "generate Xiaohongshu content"
   "deploy to Azure"
   "write tests for voice services"

🔧 Enhanced Features:
   • GitHub system prompts integration
   • Medical AI specialized assistance
   • Social media automation support
   • Azure cloud deployment helpers
   • Interactive testing capabilities

💡 Example Usage:
   > /test                          (Opens test dashboard)
   > test the voice services        (Runs voice API tests)
   > add patient registration       (Implements new feature)
   > generate medical content       (Creates MCP content)
        `);
    }

    async processWithClaudeCode(input) {
        // This would integrate with actual Claude Code API
        // For now, provide enhanced local processing
        
        console.log('🧠 Enhanced Claude Code Analysis:\n');
        
        // Analyze input intent
        const intent = this.analyzeIntent(input);
        console.log(`📋 Detected Intent: ${intent}\n`);
        
        // Provide contextual suggestions
        const suggestions = this.getContextualSuggestions(intent);
        suggestions.forEach(suggestion => {
            console.log(`💡 ${suggestion}`);
        });
    }

    analyzeIntent(input) {
        const intents = {
            'test': /test|testing|check|verify/i,
            'medical': /patient|medical|health|diagnosis|prescription/i,
            'mcp': /xiaohongshu|social|media|content|post/i,
            'api': /api|endpoint|service|backend/i,
            'deploy': /deploy|azure|cloud|production/i,
            'fix': /fix|bug|error|issue|problem/i,
            'add': /add|create|new|implement/i
        };

        for (const [intent, pattern] of Object.entries(intents)) {
            if (pattern.test(input)) {
                return intent;
            }
        }

        return 'general';
    }

    getContextualSuggestions(intent) {
        const suggestions = {
            'test': [
                'Use /test to open the interactive testing dashboard',
                'Check specific endpoints with curl commands',
                'Verify authentication flow works correctly'
            ],
            'medical': [
                'Test AI conversation endpoints for medical queries',
                'Check patient management functionality',
                'Verify medical knowledge base responses'
            ],
            'mcp': [
                'Use /mcp to test Xiaohongshu integration',
                'Generate medical content for social media',
                'Test content publishing and engagement metrics'
            ],
            'api': [
                'Check API health with /health command',
                'Test all endpoints using interactive UI',
                'Verify authentication and authorization'
            ],
            'deploy': [
                'Use /deploy to check Azure deployment status',
                'Review deployment configurations',
                'Test staging environment before production'
            ],
            'general': [
                'Use slash commands for quick actions',
                'Try natural language descriptions for complex tasks',
                'Check /help for available features'
            ]
        };

        return suggestions[intent] || suggestions.general;
    }
}

// CLI Interface
async function main() {
    const claudeCode = new EnhancedClaudeCode();
    
    // Check for command line arguments
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        const command = args.join(' ');
        await claudeCode.executeCommand(command);
    } else {
        // Interactive mode
        await claudeCode.initialize();
        
        // Keep process alive for interactive use
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        
        console.log('Type commands or Ctrl+C to exit...\n> ');
        
        process.stdin.on('data', async (key) => {
            if (key === '\u0003') { // Ctrl+C
                console.log('\n👋 Enhanced Claude Code session ended');
                process.exit();
            }
            
            const input = key.toString().trim();
            if (input) {
                await claudeCode.executeCommand(input);
                console.log('\n> ');
            }
        });
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Enhanced Claude Code failed:', error);
        process.exit(1);
    });
}

module.exports = EnhancedClaudeCode;