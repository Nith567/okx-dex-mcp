import * as OKX from '../../lib/okx.js';

// Type definitions for liquidity sources
interface LiquiditySource {
  id: string;
  logo: string;
  name: string;
}

interface LiquiditySourcesResponse {
  code: string;
  data: LiquiditySource[];
  msg: string;
}

/**
 * Get supported liquidity sources (DEXs) for a specific chain from OKX aggregator
 * @param chainId The chain ID to get liquidity sources for
 * @returns Array of supported liquidity sources with their details
 */
export async function getLiquiditySources(chainId: number): Promise<LiquiditySource[]> {
  try {
    const requestPath = '/api/v5/dex/aggregator/get-liquidity';
    const params = {
      chainIndex: chainId
    };

    const response: LiquiditySourcesResponse = await OKX.sendGetRequest(requestPath, params);

    if (response.code !== "0") {
      throw new Error(`OKX API error: ${response.msg || 'Unknown error'}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Failed to get liquidity sources: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Format liquidity sources for display
 * @param sources Array of liquidity sources
 * @param chainId The chain ID these sources are for
 * @returns Formatted string with liquidity sources information
 */
export function formatLiquiditySources(sources: LiquiditySource[], chainId: number): string {
  const chainNames: { [key: number]: string } = {
    1: 'Ethereum',
    8453: 'Base',
    10: 'Optimism',
    196: 'xLayer'
  };

  const chainName = chainNames[chainId] || `Chain ${chainId}`;
  
  let result = `🔄 Supported DEX Liquidity Sources on ${chainName} (${sources.length} sources):\n\n`;
  
  // Group by DEX family for better organization
  const dexGroups: { [key: string]: LiquiditySource[] } = {};
  
  sources.forEach(source => {
    const baseName = source.name.replace(/\s+V[0-9]+.*$/, '').replace(/\s+V2.*$/, '').replace(/\s+V3.*$/, '').replace(/\s+V4.*$/, '');
    if (!dexGroups[baseName]) {
      dexGroups[baseName] = [];
    }
    dexGroups[baseName].push(source);
  });

  // Sort groups by name
  const sortedGroups = Object.keys(dexGroups).sort();
  
  sortedGroups.forEach(groupName => {
    const group = dexGroups[groupName];
    result += `📊 ${groupName}:\n`;
    
    group.forEach(source => {
      result += `  • ${source.name} (ID: ${source.id})\n`;
    });
    result += '\n';
  });

  result += `\n🎯 Major DEX Types Available:\n`;
  result += `• AMM (Automated Market Makers): Uniswap, SushiSwap, PancakeSwap\n`;
  result += `• Concentrated Liquidity: Uniswap V3/V4, Kyber Elastic\n`;
  result += `• Stable Swaps: Curve, Aave V3\n`;
  result += `• Layer 2 Native: Aerodrome, BaseSwap (Base), Optimism native DEXs\n`;
  result += `• Cross-chain: Synapse, Hop Protocol\n\n`;
  
  result += `💡 Note: OKX DEX aggregator automatically routes through these sources to find the best prices and lowest slippage for swaps.`;
  
  return result;
}
