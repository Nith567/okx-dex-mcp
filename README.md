# OKX WITH MCP SERVER

> Swap via okx dex swap api without need of native gas token as ETH, using your from src token address you can perform swaps with okx swap api, with leveraging biconomy Fusion Mode Orchestration

## 🚀 How to Deploy This MCP Server

### Prerequisites
- Node.js 18+ or Bun installed
- Claude Desktop app
- OKX DEX API credentials
- Private key for wallet operations

### Step 1: Clone and Setup
```bash
git clone https://github.com/Nith567/okx-dex-mcp.git
cd okx-dex-mcp
bun install
```

### Step 2: Environment Configuration
Create a `.env` file in the project root:
```bash
# OKX DEX API Configuration
OKX_API_KEY=your_okx_api_key_here
OKX_SECRET_KEY=your_okx_secret_key_here
OKX_PASSPHRASE=your_okx_passphrase_here

# Wallet Configuration
PRIVATE_KEY=0x_your_private_key_here
```

### Step 3: Build the Server
```bash
bun run build
```

### Step 4: Test the Server (Optional)
```bash
# Test a token swap
bun run test:swap

# Start server locally
bun run start
```

### Step 5: Find Your Bun Path
```bash
which bun
# Example output: /opt/homebrew/bin/bun
```

### Step 6: Configure Claude Desktop
Edit your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "okx-dex": {
      "command": "/opt/homebrew/bin/bun",
      "args": [
        "run",
        "/Users/your-username/path/to/okx-mcp/build/index.js"
      ],
      "env": {
        "OKX_API_KEY": "your_okx_api_key_here",
        "OKX_SECRET_KEY": "your_okx_secret_key_here", 
        "OKX_PASSPHRASE": "your_okx_passphrase_here",
        "PRIVATE_KEY": "0x_your_private_key_here"
      }
    }
  }
}
```

**Important**: 
- Replace `/opt/homebrew/bin/bun` with your actual bun path from Step 5
- Replace `/Users/your-username/path/to/okx-mcp` with your actual project path
- Replace the environment variables with your actual credentials

### Step 7: Restart Claude Desktop
Close and reopen Claude Desktop for the configuration to take effect.

### Step 8: Test in Claude
Try this in Claude Desktop:
```
Can you check what tokens are supported on Optimism network?
```

or

```
Swap 10 USDC to USDT on Base network
```

## 🛠️ Alternative Deployment Methods

### Method 1: Using npm/yarn instead of Bun
```json
{
  "mcpServers": {
    "okx-dex": {
      "command": "node",
      "args": ["/full/path/to/okx-mcp/build/index.js"],
      "env": { ... }
    }
  }
}
```

### Method 2: HTTP Server Mode
```bash
# Start HTTP server
bun run start:http

# Use in Claude config
{
  "mcpServers": {
    "okx-dex": {
      "command": "node",
      "args": ["/full/path/to/okx-mcp/build/http-server.js"],
      "env": { ... }
    }
  }
}
```

## 🔧 Troubleshooting

### Common Issues:

1. **"Command not found" error**
   - Check your bun/node path with `which bun` or `which node`
   - Use the full absolute path in the config

2. **"Permission denied" error**
   - Make sure the build files are executable: `chmod +x build/index.js`

3. **"Environment variables not found"**
   - Double-check your `.env` file and Claude config
   - Ensure no typos in variable names

4. **"Network not supported" error**
   - Currently supports: Ethereum, Base, Optimism, xLayer
   - Check spelling of network names

5. **"Token not found" error**
   - Use the `get_supported_tokens_okx` tool to check available tokens
   - Token symbols are case-sensitive

### Debug Mode:
```bash
# Run with debug logs
DEBUG=* bun run start
```

## 📋 Available MCP Tools

Once deployed, you'll have access to these tools in Claude:

1. **`get_supported_networks_okx`** - List supported networks
2. **`get_supported_tokens_okx`** - Get tokens for a network  
3. **`get_account_balance_evm`** - Check wallet balances
4. **`get_token_swap_quote_okx`** - Get swap quotes/prices
5. **`swap_tokens_okx_mee`** - Execute gasless token swaps
6. **`transfer_tokens_evm`** - Transfer tokens
7. **`get_transaction_evm`** - Check transaction status

## 🌟 Features After Deployment

✅ **Gasless Swaps**: No ETH needed for gas fees  
✅ **Multi-Chain**: Ethereum, Base, Optimism, xLayer  
✅ **Best Prices**: OKX DEX aggregates 50+ DEX sources  
✅ **Natural Language**: "Swap 10 USDC to WETH on Base"  
✅ **Real-time Quotes**: Get current market prices  
✅ **Portfolio Management**: Check balances across chains  

# Token Swap Implementation Summary

## Overview
Successfully implemented a complete token swap system using OKX DEX API integrated with Biconomy MEE for cross-chain execution.

## Key Components

### 1. Token Swap Service (`src/core/services/token-swap.ts`)
- **Purpose**: Complete token swap implementation using OKX DEX + Biconomy MEE
- **Key Functions**:
  - `getApprovalTransaction()`: Gets approval transaction data from OKX API
  - `getSwapTransaction()`: Gets swap transaction data from OKX API  
  - `executeTokenSwap()`: Main function that orchestrates the complete swap process

### 2. MCP Tool (`src/core/tools.ts`)
- **Tool Name**: `swap_tokens_okx_mee`
- **Description**: "Swap tokens using OKX DEX aggregator with Biconomy MEE for cross-chain execution"
- **Parameters**:
  - `network`: Network name (e.g., 'base', 'optimism', 'ethereum')
  - `amount`: Amount to swap (e.g., '0.4')
  - `fromTokenSymbol`: Source token (e.g., 'USDC', 'USDT')
  - `toTokenSymbol`: Destination token (e.g., 'USDC', 'USDT')

### 3. Process Flow

#### Step-by-Step Execution:
1. **Network Validation**: Resolve network name to chain ID
2. **Token Discovery**: Get supported tokens for the network via OKX API
3. **Token Validation**: Ensure both source and destination tokens are supported
4. **Amount Calculation**: Convert human-readable amount to token decimals
5. **Wallet Setup**: Create EOA from private key and get wallet address
6. **Approval Transaction**: 
   - Call OKX `/api/v5/dex/aggregator/approve-transaction`
   - Decode transaction data to get DEX contract address and amount
7. **Swap Transaction**:
   - Call OKX `/api/v5/dex/aggregator/swap`
   - Decode transaction data to get function name and arguments
8. **MEE Integration**:
   - Create multichain nexus account with supported chains
   - Build approval composable transaction
   - Build swap composable transaction  
   - Create trigger with source token details
9. **Execution**:
   - Get fusion quote from MEE client
   - Execute the fusion quote
   - Return transaction hash and MEE scan link
   - Wait for transaction receipt

### 4. Required Environment Variables
```bash
PRIVATE_KEY=your_private_key_here
OKX_API_KEY=your_okx_api_key
OKX_SECRET_KEY=your_okx_secret_key
OKX_PASSPHRASE=your_okx_passphrase
```

### 5. Claude Desktop Configuration

Add this configuration to your Claude Desktop config file (`claude_desktop_config.json`):

 also the path in the args write like 
 
```json
{
  "mcpServers": {
    "okx": {
      "command": "path_of_bun",
      "args": [
        "run",
        "your_path/your_project_folder/build/index.js"
      ],
      "env": {
        "OKX_API_KEY": "xxxxx",
        "OKX_SECRET_KEY": "xxxxx",
        "OKX_PASSPHRASE": "xxxxx",
        "PRIVATE_KEY": "xxxxx"
      }
    }
  }
}
```

**Note**: 
- Replace `path_of_bun` with your actual bun path (find it using `which bun` in terminal)
- Replace `your_path/your_project_folder` with the actual path to your project folder

### 6. Supported Networks
- **Ethereum**: Chain ID 1
- **Base**: Chain ID 8453  
- **Optimism**: Chain ID 10
- **xLayer**: Chain ID 196

### 7. Example Usage

```typescript
// Example: Swap 0.4 USDC to USDT on Optimism
const result = await executeTokenSwap({
  network: 'optimism',
  amount: '0.4',
  fromTokenSymbol: 'USDC', 
  toTokenSymbol: 'USDT'
});

// Returns:
{
  success: true,
  hash: "0x...",
  meeScanLink: "https://...",
  receipt: {...}
}
```

### 8. Key Technical Details

#### OKX API Integration:
- Uses shared library (`src/lib/okx.ts`) for HMAC-SHA256 authentication
- Supports both GET and POST requests with proper signing
- Environment variable configuration for credentials

#### Transaction Decoding:
- Approval transactions decoded using standard ERC20 ABI
- Swap transactions decoded using DEX router ABI (`src/abi/dexRouter.json`)
- Extracts function names and arguments for MEE execution

#### Biconomy MEE:
- Multichain nexus account supports Ethereum, Base, Optimism
- Composable transactions for approve + swap operations
- Fusion quotes for optimized execution
- Cross-chain transaction management

### 9. Error Handling
- Network validation errors
- Token support validation  
- OKX API error responses
- Transaction execution failures
- MEE integration errors
****
### 10. Security Features
- Private key environment variable management
- HMAC-SHA256 signed API requests
- Transaction validation before execution
- Slippage protection (5% default)

## Architecture Benefits
- **Modular Design**: Clean separation between API, tools, and services
- **Reusable Components**: Shared OKX library eliminates code duplication
- **Type Safety**: Full TypeScript implementation with proper interfaces
- **Error Resilience**: Comprehensive error handling throughout the flow
- **Extensible**: Easy to add support for additional networks and DEX protocols
