import { type Chain } from 'viem';
import {
  base,
  mainnet,
  optimism,
  xLayer,
} from 'viem/chains';


//https://base-testnet.g.alchemy.com/v2/QyxMOKTYrNkmofq71rof8WEO1kw9VuI4
export const DEFAULT_NETWORK = 'base';
export const DEFAULT_RPC_URL = 'https://base-mainnet.g.alchemy.com/v2/QyxMOKTYrNkmofq71rof8WEO1kw9VuI4';
export const DEFAULT_CHAIN_ID = 8453;

export const chainMap: Record<number, Chain> = {
  1: mainnet,
  10: optimism,
  196: xLayer,
  8453: base,
}; 

// Map network names to chain IDs for easier reference
export const networkNameMap: Record<string, number> = {
  'mainnet': 1,
  'base': 8453,
  'optimism': 10,
  'xlayer': 196,
};

// Map chain IDs to RPC URLs
export const rpcUrlMap: Record<number, string> = {
  1: 'https://eth-mainnet.g.alchemy.com/v2/QyxMOKTYrNkmofq71rof8WEO1kw9VuI4',
  10: 'https://opt-mainnet.g.alchemy.com/v2/QyxMOKTYrNkmofq71rof8WEO1kw9VuI4',
  196: 'https://rpc.xlayer.tech',
  8453: 'https://base-mainnet.g.alchemy.com/v2/QyxMOKTYrNkmofq71rof8WEO1kw9VuI4',
};

/**
 * Resolves a chain identifier (number or string) to a chain ID
 * @param chainIdentifier Chain ID (number) or network name (string)
 * @returns The resolved chain ID
 */
export function resolveChainId(chainIdentifier: number | string): number {
  if (typeof chainIdentifier === 'number') {
    return chainIdentifier;
  }

  // Convert to lowercase for case-insensitive matching
  const networkName = chainIdentifier.toLowerCase();

  // Check if the network name is in our map
  if (networkName in networkNameMap) {
    return networkNameMap[networkName];
  }

  // Try parsing as a number
  const parsedId = parseInt(networkName);
  if (!isNaN(parsedId)) {
    return parsedId;
  }

  // Default to mainnet if not found
  return DEFAULT_CHAIN_ID;
}

/**
 * Returns the chain configuration for the specified chain ID or network name
 * @param chainIdentifier Chain ID (number) or network name (string)
 * @returns The chain configuration
 * @throws Error if the network is not supported (when string is provided)
 */
export function getChain(chainIdentifier: number | string = DEFAULT_CHAIN_ID): Chain {
  if (typeof chainIdentifier === 'string') {
    const networkName = chainIdentifier.toLowerCase();
    // Try to get from direct network name mapping first
    if (networkNameMap[networkName]) {
      return chainMap[networkNameMap[networkName]] || base;
    }

    // If not found, throw an error
    throw new Error(`Unsupported network: ${chainIdentifier}`);
  }

  // If it's a number, return the chain from chainMap
  return chainMap[chainIdentifier] || base;
}

/**
 * Gets the appropriate RPC URL for the specified chain ID or network name
 * @param chainIdentifier Chain ID (number) or network name (string)
 * @returns The RPC URL for the specified chain
 */
export function getRpcUrl(chainIdentifier: number | string = DEFAULT_CHAIN_ID): string {
  const chainId = typeof chainIdentifier === 'string'
    ? resolveChainId(chainIdentifier)
    : chainIdentifier;

  return rpcUrlMap[chainId] || DEFAULT_RPC_URL;
}

/**
 * Get a list of supported networks
 * @returns Array of supported network names (excluding short aliases)
 */
export function getSupportedNetworks(): string[] {
  return Object.keys(networkNameMap)
    .filter(name => name.length > 2) // Filter out short aliases
    .sort();
}
