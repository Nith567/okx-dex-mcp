import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {getSupportedNetworks, getRpcUrl, DEFAULT_NETWORK} from "./chains.js";
import * as services from "./services/index.js";
import {type Address, type Hex, type Hash, WriteContractParameters, Abi} from 'viem';
import { getPrivateKeyAsHex } from "./config.js";

/**
 * Register all EVM-related tools with the MCP server
 *
 * @param server The MCP server instance
 */
export function registerEVMTools(server: McpServer) {


  // Get chain information
  server.tool(
    "get_chain_info",
    "Get information about EVM networks including Ethereum, Base, and Optimism that are supported by OKX DEX API",
    {
      network: z.string().optional().describe("Network name (e.g., 'base', 'optimism', 'ethereum') or chain ID. Supports Ethereum, Base and Optimism networks. Defaults to Base mainnet.")
    },
    async ({ network = DEFAULT_NETWORK }) => {
      try {
        const chainId = await services.getChainId(network);
        const blockNumber = await services.getBlockNumber(network);
        const rpcUrl = getRpcUrl(network);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              network,
              chainId,
              blockNumber: blockNumber.toString(),
              rpcUrl
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching chain info: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

    // OKX DEX API - Get supported tokens for a network
  server.tool(
    "get_okx_dex_supported_tokens",
    "Get all supported tokens from OKX DEX API for a specific network. Returns token symbols, names, contract addresses, decimals, and metadata.",
    {
      network: z.string().optional().describe("Network name (e.g., 'base', 'optimism', 'ethereum') or chain ID. Supports Ethereum, Base and Optimism networks. Defaults to Base mainnet.")
    },
    async ({ network = DEFAULT_NETWORK }) => {
      try {
        const chainId = await services.getChainId(network);
        
        // Get supported tokens from OKX DEX API
        const tokens = await services.getOKXSupportedTokens(chainId);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              network,
              chainId,
              totalTokens: tokens.length,
              tokens: tokens.map(token => ({
                symbol: token.symbol,
                name: token.name,
                contractAddress: token.contractAddress,
                decimals: token.decimals
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching OKX DEX supported tokens: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get supported networks
  server.tool(
    "get_supported_networks",
    "Get a list of supported OKX evm networks",//at present we set to limited okx dex api supported chains
    {},
    async () => {
      try {
        const networks = getSupportedNetworks();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              supportedNetworks: networks
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching supported networks: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );


  // Get native token balance
  server.tool(
    "get_balance",
    "Get the native token balance (ETH) for an address",
    {
      address: z.string().describe("The wallet address name (e.g., '0x1234...') to check the balance for"),
      network: z.string().optional().describe("Network name (e.g., 'base', 'optimism') or chain ID. Supports Base and Optimism networks. Defaults to Base mainnet.")
    },
    async ({ address, network = DEFAULT_NETWORK }) => {
      try {
        const balance = await services.getBalance(address, network);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address,
              network,
              wei: balance.wei.toString(),
              ether: balance.eth
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching balance: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // OKX DEX API - Get token swap quote
  server.tool(
    "get_token_swap_quote_okx",
    "Get a price quote for token swaps without executing the trade. Shows expected output amount, price impact, gas fees, and DEX routing information from OKX aggregator.",
    {
      network: z.string().optional().describe("Network name (e.g., 'base', 'optimism', 'ethereum') or chain ID. Defaults to Base mainnet."),
      amount: z.string().describe("Amount of tokens to swap (e.g., '1.5' for 1.5 tokens)"),
      fromTokenSymbol: z.string().describe("Symbol of the token to swap from (e.g., 'USDC', 'ETH', 'WETH')"),
      toTokenSymbol: z.string().describe("Symbol of the token to swap to (e.g., 'USDC', 'ETH', 'WETH')")
    },
    async ({ network = DEFAULT_NETWORK, amount, fromTokenSymbol, toTokenSymbol }) => {
      try {
        const quote = await services.getTokenSwapQuote({
          network,
          amount,
          fromTokenSymbol,
          toTokenSymbol
        });

        const formattedQuote = services.formatQuote(quote, {
          network,
          amount,
          fromTokenSymbol,
          toTokenSymbol
        });

        return {
          content: [{
            type: "text",
            text: formattedQuote
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error getting swap quote: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // OKX DEX API - Get liquidity sources for a network
  server.tool(
    "get_liquidity_sources_okx",
    "Get all supported liquidity sources (DEXs) from OKX DEX aggregator for a specific network. Shows which DEXs like Uniswap, Curve, Aave, etc. are available for routing swaps.",
    {
      network: z.string().optional().describe("Network name (e.g., 'base', 'optimism', 'ethereum') or chain ID. Defaults to Base mainnet.")
    },
    async ({ network = DEFAULT_NETWORK }) => {
      try {
        const chainId = await services.getChainId(network);
        
        // Get liquidity sources from OKX DEX API
        const sources = await services.getLiquiditySources(chainId);
        const formattedSources = services.formatLiquiditySources(sources, chainId);

        return {
          content: [{
            type: "text",
            text: formattedSources
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching OKX DEX liquidity sources: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get ERC20 balance
  server.tool(
    "get_erc20_balance",
    "Get the ERC20 token balance of an EVM address. If no address is provided, uses the address derived from the configured private key.",
    {
      address: z.string().optional().describe("The EVM address to check. If not provided, uses the address from the configured private key."),
      tokenAddress: z.string().describe("The ERC20 token contract address"),
      network: z.string().optional().describe("Network name or chain ID. Defaults to Base mainnet.")
    },
    async ({ address, tokenAddress, network = DEFAULT_NETWORK }) => {
      try {
        // Use configured address if no address provided
        let targetAddress = address;
        if (!targetAddress) {
          const privateKeyValue = getPrivateKeyAsHex();
          if (!privateKeyValue) {
            return {
              content: [{ type: "text", text: "Error: No address provided and PRIVATE_KEY environment variable is not set. Please provide an address or set the PRIVATE_KEY environment variable." }],
              isError: true
            };
          }
          targetAddress = services.getAddressFromPrivateKey(privateKeyValue);
        }

        const balance = await services.getERC20Balance(
          tokenAddress as Address,
          targetAddress as Address,
          network
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address: targetAddress,
              tokenAddress,
              network,
              balance: {
                raw: balance.raw.toString(),
                formatted: balance.formatted,
                decimals: balance.token.decimals
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        // Use the address that was actually used for the request
        const usedAddress = address || "configured private key address";
        return {
          content: [{
            type: "text",
            text: `Error fetching ERC20 balance for ${usedAddress}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get ERC20 token balance
  server.tool(
    "get_token_balance",
    "Get the balance of an ERC20 token for an address",
    {
      tokenAddress: z.string().describe("The contract address name of the ERC20 token (e.g., '0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1')"),
      ownerAddress: z.string().describe("The wallet address name to check the balance for (e.g., '0x1234...')"),
      network: z.string().optional().describe("Network name (e.g., 'base', 'optimism') or chain ID. Supports Base and Optimism networks. Defaults to Base mainnet.")
    },
    async ({ tokenAddress, ownerAddress, network = DEFAULT_NETWORK }) => {
      try {
        const balance = await services.getERC20Balance(tokenAddress, ownerAddress, network);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              tokenAddress,
              owner: ownerAddress,
              network,
              raw: balance.raw.toString(),
              formatted: balance.formatted,
              symbol: balance.token.symbol,
              decimals: balance.token.decimals
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching token balance: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get transaction by hash
  server.tool(
    "get_transaction",
    "Get detailed information about a specific transaction by its hash. Includes sender, recipient, value, data, and more.",
    {
      txHash: z.string().describe("The transaction hash to look up (e.g., '0x1234...')"),
      network: z.string().optional().describe("Network name (e.g., 'base', 'optimism') or chain ID. Defaults to Base mainnet.")
    },
    async ({ txHash, network = DEFAULT_NETWORK }) => {
      try {
        const tx = await services.getTransaction(txHash as Hash, network);

        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson(tx)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching transaction ${txHash}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get transaction receipt
  server.tool(
    "get_transaction_receipt",
    "Get a transaction receipt by its hash",
    {
      txHash: z.string().describe("The transaction hash to look up"),
      network: z.string().optional().describe("Network name or chain ID. Defaults to Base mainnet.")
    },
    async ({ txHash, network = DEFAULT_NETWORK }) => {
      try {
        const receipt = await services.getTransactionReceipt(txHash as Hash, network);

        return {
          content: [{
            type: "text",
            text: services.helpers.formatJson(receipt)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching transaction receipt ${txHash}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  // TRANSFER TOOLS

  // Transfer native tokens (ETH)
  server.tool(
    "transfer_native",
    "Transfer native tokens (ETH) to an address",
    {
      to: z.string().describe("The recipient address (e.g., '0x1234...'"),
      amount: z.string().describe("Amount to send in ETH (or the native token of the network), as a string (e.g., '0.1')"),
      network: z.string().optional().describe("Network name (e.g., 'base', 'optimism') or chain ID. Defaults to Base mainnet.")
    },
    async ({ to, amount, network = DEFAULT_NETWORK }) => {
      try {
        const txHash = await services.transferEth(to, amount, network);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              txHash,
              to,
              amount,
              network
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error transferring native tokens: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Transfer ERC20
  server.tool(
    "transfer_erc20",
    "Transfer ERC20 tokens to another address",
    {
      tokenAddress: z.string().describe("The address of the ERC20 token contract"),
      toAddress: z.string().describe("The recipient address"),
      amount: z.string().describe("The amount of tokens to send (in token units, e.g., '10' for 10 tokens)"),
      network: z.string().optional().describe("Network name (e.g., 'base', 'optimism') or chain ID. Defaults to Base mainnet.")
    },
    async ({ tokenAddress, toAddress, amount, network = DEFAULT_NETWORK }) => {
      try {
        const result = await services.transferERC20(
          tokenAddress,
          toAddress,
          amount,
          network
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              txHash: result.txHash,
              network,
              tokenAddress,
              recipient: toAddress,
              amount: result.amount.formatted,
              symbol: result.token.symbol
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error transferring ERC20 tokens: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );





  // CONTRACT TOOLS

  // Get ERC20 token information
  server.tool(
    "get_token_info",
    "Get comprehensive information about an ERC20 token including name, symbol, decimals, total supply, and other metadata. Use this to analyze any token on EVM chains.",
    {
      tokenAddress: z.string().describe("The contract address of the ERC20 token (e.g., '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')"),
      network: z.string().optional().describe("Network name (e.g., 'base', 'optimism') or chain ID. Defaults to Base mainnet.")
    },
    async ({ tokenAddress, network = DEFAULT_NETWORK }) => {
      try {
        const tokenInfo = await services.getERC20TokenInfo(tokenAddress as Address, network);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address: tokenAddress,
              network,
              ...tokenInfo
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching token info: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // WALLET TOOLS

  // Get address from private key
  server.tool(
    "get_address_from_private_key",
    "Get the EVM address derived from a private key",
    {}, // Schema is empty as privateKey parameter was removed
    async () => { // Handler function starts here
      try {
        const privateKeyValue = getPrivateKeyAsHex();
        if (!privateKeyValue) {
          return {
            content: [{ type: "text", text: "Error: The PRIVATE_KEY environment variable is not set. Please set this variable with your private key and restart the MCP server for this tool to function." }],
            isError: true
          };
        }

        const address = services.getAddressFromPrivateKey(privateKeyValue);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address,
              // Do not return the private key in the response.
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error deriving address from private key: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );



  server.tool(
    "swap_tokens_native_src_payNativeGasTokenfees",
    "Swap tokens from src chain such as Ethereum,Base and optimism network using OKX DEX aggregator with Biconomy MEE for better UX ",
    {
      network: z.string().describe("Network name (e.g., 'base', 'optimism', 'ethereum')"),
      amount: z.string().describe("Amount to swap (in human readable format, e.g., '0.4' for 0.4 tokens)"),
      fromTokenSymbol: z.string().describe("Source token symbol (e.g., 'USDC', 'USDT', 'WETH')"),
      toTokenSymbol: z.string().describe("Destination token symbol (e.g., 'USDC', 'USDT', 'ETH')")
    },
    async ({ network, amount, fromTokenSymbol, toTokenSymbol }) => {
      try {
        const { executeTokenSwap } = await import("./services/token-swap.js");
        
        const result = await executeTokenSwap({
          network,
          amount,
          fromTokenSymbol,
          toTokenSymbol
        });

        if (result.success) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                transactionHash: result.hash,
                meeScanLink: result.meeScanLink,
                message: `Successfully swapped ${amount} ${fromTokenSymbol} to ${toTokenSymbol} on ${network}`,
                receipt: result.receipt
              }, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)
            }]
          };
        } else {
          return {
            content: [{
              type: "text", 
              text: JSON.stringify({
                success: false,
                error: result.error || "Unknown error occurred during token swap"
              }, null, 2)
            }],
            isError: true
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: `Error swapping tokens: ${error instanceof Error ? error.message : String(error)}`
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );
}
