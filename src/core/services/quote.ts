import * as OKX from '../../lib/okx.js';
import { parseUnits } from 'viem';

// Type definitions for quote response
interface TokenInfo {
  decimal: string;
  isHoneyPot: boolean;
  taxRate: string;
  tokenContractAddress: string;
  tokenSymbol: string;
  tokenUnitPrice: string;
}

interface DexProtocol {
  dexName: string;
  percent: string;
}

interface SubRouter {
  dexProtocol: DexProtocol[];
  fromToken: TokenInfo;
  toToken: TokenInfo;
}

interface DexRouter {
  router: string;
  routerPercent: string;
  subRouterList: SubRouter[];
}

interface QuoteCompare {
  amountOut: string;
  dexLogo: string;
  dexName: string;
  tradeFee: string;
}

interface QuoteData {
  chainId: string;
  dexRouterList: DexRouter[];
  estimateGasFee: string;
  fromToken: TokenInfo;
  fromTokenAmount: string;
  originToTokenAmount: string;
  priceImpactPercentage: string;
  quoteCompareList: QuoteCompare[];
  swapMode: string;
  toToken: TokenInfo;
  toTokenAmount: string;
  tradeFee: string;
}

interface QuoteResponse {
  code: string;
  data: QuoteData[];
  msg: string;
}

export interface QuoteParams {
  network: string;
  amount: string;
  fromTokenSymbol: string;
  toTokenSymbol: string;
}

/**
 * Get price quote for token swap from OKX DEX aggregator
 * @param params Quote parameters including network, amount, and token symbols
 * @returns Quote data with price information and routing details
 */
export async function getTokenSwapQuote(params: QuoteParams): Promise<QuoteData> {
  try {
    const { network, amount, fromTokenSymbol, toTokenSymbol } = params;

    // Import the services we need
    const { getChainId } = await import('./index.js');
    const { getOKXSupportedTokens } = await import('./supported-tokens.js');

    // 1. Get chain ID
    const chainId = await getChainId(network);

    // 2. Get supported tokens for the network
    const supportedTokens = await getOKXSupportedTokens(chainId);

    // 3. Find from and to tokens
    const fromToken = supportedTokens.find(token => 
      token.symbol.toUpperCase() === fromTokenSymbol.toUpperCase()
    );
    const toToken = supportedTokens.find(token => 
      token.symbol.toUpperCase() === toTokenSymbol.toUpperCase()
    );

    if (!fromToken) {
      throw new Error(`Token ${fromTokenSymbol} not supported on ${network}`);
    }
    if (!toToken) {
      throw new Error(`Token ${toTokenSymbol} not supported on ${network}`);
    }

    // 4. Calculate amount with decimals
    const amountWithDecimals = parseUnits(amount, fromToken.decimals);

    // 5. Get quote from OKX
    const requestPath = '/api/v5/dex/aggregator/quote';
    const params_okx = {
      chainIndex: chainId,
      amount: amountWithDecimals.toString(),
      fromTokenAddress: fromToken.contractAddress,
      toTokenAddress: toToken.contractAddress
    };

    const response: QuoteResponse = await OKX.sendGetRequest(requestPath, params_okx);

    if (response.code !== "0") {
      throw new Error(`OKX API error: ${response.msg || 'Unknown error'}`);
    }

    if (!response.data || response.data.length === 0) {
      throw new Error('No quote data returned from OKX');
    }

    return response.data[0];
  } catch (error) {
    throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Format quote data for display
 * @param quote Quote data from OKX
 * @param params Original quote parameters
 * @returns Formatted string with quote information
 */
export function formatQuote(quote: QuoteData, params: QuoteParams): string {
  const { network, amount, fromTokenSymbol, toTokenSymbol } = params;
  
  // Calculate the output amount in human readable format
  const fromDecimals = parseInt(quote.fromToken.decimal);
  const toDecimals = parseInt(quote.toToken.decimal);
  const outputAmountFormatted = (Number(quote.toTokenAmount) / (10 ** toDecimals)).toFixed(6);
  
  let result = `💰 Token Swap Quote on ${network.charAt(0).toUpperCase() + network.slice(1)}\n\n`;
  
  result += `📊 Trade Details:\n`;
  result += `   Input: ${amount} ${quote.fromToken.tokenSymbol} (${quote.fromToken.tokenUnitPrice} USD each)\n`;
  result += `   Output: ${outputAmountFormatted} ${quote.toToken.tokenSymbol} (${quote.toToken.tokenUnitPrice} USD each)\n`;
  result += `   Price Impact: ${quote.priceImpactPercentage}%\n`;
  result += `   Estimated Gas: ${quote.estimateGasFee} gas units\n`;
  result += `   Trade Fee: ${quote.tradeFee} USD\n\n`;

  result += `🛣️  Best Route (${quote.dexRouterList[0].routerPercent}% of trade):\n`;
  if (quote.dexRouterList[0].subRouterList.length > 0) {
    quote.dexRouterList[0].subRouterList.forEach((subrouter, index) => {
      subrouter.dexProtocol.forEach(protocol => {
        result += `   ${index + 1}. ${protocol.dexName} (${protocol.percent}%)\n`;
      });
    });
  }
  result += '\n';

  result += `🏆 Alternative DEX Comparisons:\n`;
  quote.quoteCompareList.slice(0, 5).forEach((compare, index) => {
    const altOutputFormatted = (Number(compare.amountOut) / (10 ** toDecimals)).toFixed(6);
    result += `   ${index + 1}. ${compare.dexName}: ${altOutputFormatted} ${quote.toToken.tokenSymbol} (Fee: ${compare.tradeFee} USD)\n`;
  });

  if (quote.quoteCompareList.length > 5) {
    result += `   ... and ${quote.quoteCompareList.length - 5} more options\n`;
  }

  result += `\n💡 This is a quote only. Use the swap tool to execute the trade.`;
  
  return result;
}
