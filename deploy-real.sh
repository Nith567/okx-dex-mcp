#!/bin/bash

echo "🚀 OKX MCP Server - Real Deployment Script"
echo "=========================================="

# Step 1: Check prerequisites
echo "📋 Checking prerequisites..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Installing bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
    echo "✅ Bun installed successfully"
else
    echo "✅ Bun is already installed: $(which bun)"
fi

# Check if Claude Desktop is installed
if [ -d "$HOME/Library/Application Support/Claude" ]; then
    echo "✅ Claude Desktop found"
else
    echo "❌ Claude Desktop not found. Please install Claude Desktop from: https://claude.ai/download"
    exit 1
fi

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
bun install

# Step 3: Build the project
echo "🔨 Building the project..."
bun run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Step 4: Check .env file
echo "🔧 Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << 'EOF'
# OKX DEX API Configuration
OKX_API_KEY=your_okx_api_key_here
OKX_SECRET_KEY=your_okx_secret_key_here
OKX_PASSPHRASE=your_okx_passphrase_here

# Wallet Configuration
PRIVATE_KEY=0x_your_private_key_here
EOF
    echo "📝 Please edit .env file with your actual credentials"
    echo "❌ Deployment paused. Fill in your .env file and run this script again."
    exit 1
else
    echo "✅ .env file exists"
    # Check if .env has placeholder values
    if grep -q "your_okx_api_key_here" .env; then
        echo "⚠️  .env file contains placeholder values. Please update with real credentials."
        echo "📝 Edit .env file and run this script again."
        exit 1
    fi
fi

# Step 5: Test the server
echo "🧪 Testing the server..."
timeout 10s bun run start &
SERVER_PID=$!
sleep 3

if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server starts successfully"
    kill $SERVER_PID
else
    echo "❌ Server failed to start"
    exit 1
fi

# Step 6: Get paths for Claude Desktop config
BUN_PATH=$(which bun)
PROJECT_PATH=$(pwd)
BUILD_PATH="$PROJECT_PATH/build/index.js"

echo "📍 Detected paths:"
echo "   Bun path: $BUN_PATH"
echo "   Project path: $PROJECT_PATH"
echo "   Build path: $BUILD_PATH"

# Step 7: Create Claude Desktop config
CLAUDE_CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
echo "🔧 Creating Claude Desktop configuration..."

# Read current .env values (safely)
OKX_API_KEY=$(grep "OKX_API_KEY=" .env | cut -d '=' -f2)
OKX_SECRET_KEY=$(grep "OKX_SECRET_KEY=" .env | cut -d '=' -f2)
OKX_PASSPHRASE=$(grep "OKX_PASSPHRASE=" .env | cut -d '=' -f2)
PRIVATE_KEY=$(grep "PRIVATE_KEY=" .env | cut -d '=' -f2)

# Backup existing config if it exists
if [ -f "$CLAUDE_CONFIG_PATH" ]; then
    cp "$CLAUDE_CONFIG_PATH" "$CLAUDE_CONFIG_PATH.backup.$(date +%s)"
    echo "✅ Backed up existing Claude config"
fi

# Create or update Claude config
cat > "$CLAUDE_CONFIG_PATH" << EOF
{
  "mcpServers": {
    "okx-dex": {
      "command": "$BUN_PATH",
      "args": [
        "run",
        "$BUILD_PATH"
      ],
      "env": {
        "OKX_API_KEY": "$OKX_API_KEY",
        "OKX_SECRET_KEY": "$OKX_SECRET_KEY",
        "OKX_PASSPHRASE": "$OKX_PASSPHRASE",
        "PRIVATE_KEY": "$PRIVATE_KEY"
      }
    }
  }
}
EOF

echo "✅ Claude Desktop config created at: $CLAUDE_CONFIG_PATH"

# Step 8: Final instructions
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "📋 What's next:"
echo "1. Close Claude Desktop completely (Cmd+Q)"
echo "2. Reopen Claude Desktop"
echo "3. Test with: 'Can you check what tokens are supported on Optimism network?'"
echo ""
echo "🔍 Troubleshooting:"
echo "- If Claude shows connection errors, check the terminal for error messages"
echo "- Verify your OKX API credentials are correct"
echo "- Make sure your private key has the 0x prefix"
echo ""
echo "📝 Config file location: $CLAUDE_CONFIG_PATH"
echo "🏗️  Build file location: $BUILD_PATH"
echo ""
echo "Happy swapping! 🚀"
