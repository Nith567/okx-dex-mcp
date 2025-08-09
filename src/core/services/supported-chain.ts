
import * as OKX from '../../lib/okx.js';

// Type definitions for OKX supported chains
export interface SupportedChain {
  chainId: number;
  chainIndex: number;
}

export interface OKXSupportedChainResponse {
  code: string;
  msg?: string;
  data: SupportedChain[];
}

/**
 * Get all supported chains from OKX DEX aggregator (raw list, not filtered)
 * @returns Array of supported chain objects from OKX
 */

/**
 * Get all supported chains from OKX DEX aggregator (formatted)
 * @returns Promise<SupportedChain[]> Array of supported chain data
 */
export async function getOKXSupportedChains(): Promise<SupportedChain[]> {
  const requestPath = '/api/v5/dex/aggregator/supported/chain';
  const response: OKXSupportedChainResponse = await OKX.sendGetRequest(requestPath);
  if (response.code !== '0') {
    throw new Error(`OKX API error: ${response.msg || 'Unknown error'}`);
  }
  // Return only the relevant fields, formatted
  return response.data.map((chain) => ({
    chainId: Number(chain.chainId),
    chainIndex: Number(chain.chainIndex),
  }));
}
