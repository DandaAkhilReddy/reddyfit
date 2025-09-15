#!/bin/bash

# ReddyTalk MCP Server Setup Script
echo "🚀 Setting up ReddyTalk MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed. Please install npm first."
    exit 1
fi

# Install MCP SDK if not already installed
echo "📦 Installing MCP SDK dependencies..."
npm install @modelcontextprotocol/sdk

# Create logs directory if it doesn't exist
mkdir -p logs/calls
mkdir -p logs/mcp
echo "📁 Created log directories"

# Set execute permissions on MCP server files
chmod +x src/mcp/server.js
chmod +x src/mcp/enhanced-server.js
chmod +x src/mcp/client-example.js
echo "🔧 Set execute permissions"

# Create MCP startup script
cat > start-mcp-server.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting ReddyTalk Enhanced MCP Server..."
cd "$(dirname "$0")"
node src/mcp/enhanced-server.js
EOF

chmod +x start-mcp-server.sh
echo "📝 Created startup script: start-mcp-server.sh"

# Create MCP test script
cat > test-mcp-server.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing ReddyTalk MCP Server..."
cd "$(dirname "$0")"
node src/mcp/client-example.js
EOF

chmod +x test-mcp-server.sh
echo "🧪 Created test script: test-mcp-server.sh"

# Update package.json scripts
echo "📝 Updating package.json scripts..."
npx json -I -f package.json -e '
this.scripts = this.scripts || {};
this.scripts["mcp:start"] = "node src/mcp/enhanced-server.js";
this.scripts["mcp:test"] = "node src/mcp/client-example.js";
this.scripts["mcp:basic"] = "node src/mcp/server.js";'

# Create Claude Desktop config directory if it doesn't exist (for macOS/Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_DIR="$HOME/Library/Application Support/Claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CONFIG_DIR="$HOME/.config/claude"
else
    CONFIG_DIR="$HOME/.claude"
fi

mkdir -p "$CONFIG_DIR"

# Create Claude Desktop configuration
cat > "$CONFIG_DIR/claude_desktop_config.json" << EOF
{
  "mcpServers": {
    "reddytalk": {
      "command": "node",
      "args": ["$(pwd)/src/mcp/enhanced-server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF

echo "⚙️ Created Claude Desktop configuration at: $CONFIG_DIR/claude_desktop_config.json"

echo ""
echo "✅ ReddyTalk MCP Server setup complete!"
echo ""
echo "📋 Available commands:"
echo "  npm run mcp:start    - Start enhanced MCP server"
echo "  npm run mcp:test     - Test MCP server functionality"
echo "  npm run mcp:basic    - Start basic MCP server"
echo "  ./start-mcp-server.sh - Start server with script"
echo "  ./test-mcp-server.sh  - Test server with script"
echo ""
echo "🔧 Configuration files created:"
echo "  - mcp-enhanced.json (MCP server configuration)"
echo "  - $CONFIG_DIR/claude_desktop_config.json (Claude Desktop config)"
echo ""
echo "🚀 To start using the MCP server:"
echo "  1. Run: npm run mcp:test (to verify everything works)"
echo "  2. Run: npm run mcp:start (to start the server)"
echo "  3. Connect from Claude Desktop or any MCP client"
echo ""