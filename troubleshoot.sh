#!/bin/bash

echo "🔍 OKX MCP Server - Troubleshooting & Verification"
echo "=================================================="

# Check system requirements
echo "📋 System Check:"
echo "- OS: $(uname -s)"
echo "- Shell: $SHELL"
echo "- Node version: $(node --version 2>/dev/null || echo 'Not installed')"
echo "- Bun version: $(bun --version 2>/dev/null || echo 'Not installed')"
echo ""

# Check project structure
echo "📁 Project Structure Check:"
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json missing"
fi

if [ -f "build/index.js" ]; then
    echo "✅ build/index.js exists"
else
    echo "❌ build/index.js missing - run 'bun run build'"
fi

if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "📝 .env contents (sanitized):"
    cat .env | sed 's/=.*/=***HIDDEN***/'
else
    echo "❌ .env file missing"
fi
echo ""

# Check Claude Desktop config
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
echo "🔧 Claude Desktop Config Check:"
if [ -f "$CLAUDE_CONFIG" ]; then
    echo "✅ Claude config exists at: $CLAUDE_CONFIG"
    echo "📝 Config preview:"
    cat "$CLAUDE_CONFIG" | head -20
else
    echo "❌ Claude config missing at: $CLAUDE_CONFIG"
fi
echo ""

# Test server startup
echo "🧪 Server Startup Test:"
echo "Starting server for 5 seconds..."
timeout 5s bun run start &
SERVER_PID=$!
sleep 2

if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "✅ Server starts successfully"
    kill $SERVER_PID 2>/dev/null
else
    echo "❌ Server failed to start"
    echo "💡 Try running 'bun run start' manually to see error messages"
fi
echo ""

# Check network connectivity to OKX
echo "🌐 Network Connectivity Test:"
if curl -s --max-time 5 "https://www.okx.com/api/v5/public/time" > /dev/null; then
    echo "✅ Can reach OKX API"
else
    echo "❌ Cannot reach OKX API - check internet connection"
fi
echo ""

# Quick API test (if credentials are provided)
echo "🔑 API Credentials Test:"
if [ -f ".env" ] && ! grep -q "your_okx_api_key_here" .env; then
    echo "✅ .env file has been configured"
    echo "💡 To test API credentials, run: bun run test:swap"
else
    echo "⚠️  .env file needs to be configured with real credentials"
fi
echo ""

echo "🎯 Quick Fix Commands:"
echo "- Install bun: curl -fsSL https://bun.sh/install | bash"
echo "- Install deps: bun install"
echo "- Build project: bun run build"  
echo "- Test server: bun run start"
echo "- Test swap: bun run test:swap"
echo ""

echo "🆘 If you're still having issues:"
echo "1. Check the full error messages when running 'bun run start'"
echo "2. Verify your OKX API credentials on the OKX website"
echo "3. Make sure Claude Desktop is completely closed before restarting"
echo "4. Check that your private key starts with '0x'"
