# 🚀 REAL DEPLOYMENT GUIDE - OKX MCP SERVER

## The Fastest Way to Deploy (5 minutes)

### Option 1: Automated Deployment (Recommended)

```bash
# 1. Run the automated deployment script
./deploy-real.sh

# 2. If there are any issues, run the troubleshooting script
./troubleshoot.sh
```

### Option 2: Manual Step-by-Step

#### Step 1: Get Your OKX API Credentials
1. Go to [OKX.com](https://www.okx.com)
2. Sign up/Login → Account → API Management
3. Create a new API key with these permissions:
   - ✅ Trade
   - ✅ Read  
   - ❌ Withdraw (not needed)
4. Save these 3 values:
   - API Key
   - Secret Key  
   - Passphrase

#### Step 2: Get Your Wallet Private Key
```bash
# If you have MetaMask, export your private key:
# MetaMask → Account Details → Export Private Key

# Or create a new wallet (for testing):
# Use any wallet generator, make sure it starts with 0x
```

#### Step 3: Set Up Environment
```bash
# Clone/navigate to project
cd /path/to/okx-mcp

# Install dependencies
bun install

# Create .env file
cat > .env << 'EOF'
OKX_API_KEY=your_real_api_key_here
OKX_SECRET_KEY=your_real_secret_key_here  
OKX_PASSPHRASE=your_real_passphrase_here
PRIVATE_KEY=0x_your_real_private_key_here
EOF

# Edit .env with your real credentials
nano .env  # or code .env or vim .env
```

#### Step 4: Build and Test
```bash
# Build the project
bun run build

# Test it works
bun run start
# You should see: "OKX MCP Server listening on stdio"
# Press Ctrl+C to stop

# Test with a real swap (optional)
bun run test:swap
```

#### Step 5: Configure Claude Desktop
```bash
# Find your bun path
which bun
# Example output: /opt/homebrew/bin/bun

# Find your project path
pwd
# Example: /Users/yourname/Desktop/okx-mcp

# Open Claude Desktop config
code "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
# Or: open "$HOME/Library/Application Support/Claude/"
```

Add this configuration (replace the paths with your actual paths):
```json
{
  "mcpServers": {
    "okx-dex": {
      "command": "/opt/homebrew/bin/bun",
      "args": [
        "run", 
        "/Users/yourname/Desktop/okx-mcp/build/index.js"
      ],
      "env": {
        "OKX_API_KEY": "your_real_api_key_here",
        "OKX_SECRET_KEY": "your_real_secret_key_here",
        "OKX_PASSPHRASE": "your_real_passphrase_here", 
        "PRIVATE_KEY": "0x_your_real_private_key_here"
      }
    }
  }
}
```

#### Step 6: Restart Claude Desktop
```bash
# Completely quit Claude Desktop
# Press Cmd+Q (don't just close the window)

# Reopen Claude Desktop
open -a "Claude"
```

#### Step 7: Test in Claude
Try these commands in Claude Desktop:

```
Can you check what tokens are supported on Base network?
```

```
Get a quote for swapping 10 USDC to WETH on Optimism
```

```
Swap 5 USDC to USDT on Base network
```

## 🔥 Common Real-World Issues & Fixes

### Issue: "Command not found"
**Fix**: Wrong bun path in config
```bash
# Get the correct path
which bun
# Use that exact path in claude_desktop_config.json
```

### Issue: "Cannot connect to MCP server"
**Fix**: Build files missing or wrong path
```bash
# Rebuild
bun run build

# Check file exists  
ls -la build/index.js

# Use absolute path in config
pwd  # Copy this path
```

### Issue: "API authentication failed" 
**Fix**: Wrong OKX credentials
```bash
# Test credentials manually
curl -X GET "https://www.okx.com/api/v5/public/time"

# Double-check your API key permissions on OKX.com
# Make sure Trading is enabled
```

### Issue: "Private key invalid"
**Fix**: Private key format
```bash
# Make sure it starts with 0x
# Example: 0x1234567890abcdef...
# NOT: 1234567890abcdef... (missing 0x)
```

### Issue: Server starts but tools don't work
**Fix**: Environment variables not loaded
```bash
# Test env vars are loaded
bun run start
# Look for "OKX_API_KEY loaded" in output

# Make sure .env file is in the same directory as build/index.js
```

## 🎯 Verification Steps

After deployment, verify everything works:

1. **Server Connection**: Claude should show "okx-dex" in available tools
2. **API Access**: Run "Get supported tokens on Ethereum" 
3. **Real Swap**: Try a small swap like "Swap 1 USDC to USDT on Base"

## 🆘 Still Having Issues?

Run the troubleshooting script:
```bash
./troubleshoot.sh
```

Or check these:
- [ ] Bun is installed and in PATH
- [ ] Project is built (`build/index.js` exists)
- [ ] `.env` file has real credentials (no placeholder text)
- [ ] Claude Desktop config uses absolute paths
- [ ] Claude Desktop was completely restarted (Cmd+Q then reopen)
- [ ] OKX API credentials have Trading permissions
- [ ] Private key starts with `0x`
- [ ] Internet connection works

## 💡 Pro Tips

1. **Test locally first**: Always run `bun run start` to test before configuring Claude
2. **Use absolute paths**: Never use `~` or relative paths in Claude config  
3. **Check logs**: If swap fails, the error message usually tells you exactly what's wrong
4. **Small amounts first**: Test with small amounts ($1-5) before larger swaps
5. **Multiple networks**: The server supports Ethereum, Base, Optimism, and xLayer

## 🏆 Success! 

If you can run these commands in Claude, you're all set:

- ✅ "Show me all supported networks"
- ✅ "What tokens are available on Base?"  
- ✅ "Get a quote for 10 USDC to WETH on Optimism"
- ✅ "Swap 5 USDC to USDT on Base"

**You now have a gasless, multi-chain DEX aggregator in Claude! 🎉**
