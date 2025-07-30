import {
  type Address,
  type Hash,
  type TransactionReceipt,
  type EstimateGasParameters
} from 'viem';
import { getPublicClient } from './clients.js';
import {DEFAULT_NETWORK} from "../chains.js";
import * as OKX from '../../lib/okx.js';

// Type definitions for OKX API responses
export interface OKXToken {
  decimals: string;
  tokenContractAddress: string;
  tokenLogoUrl: string;
  tokenName: string;
  tokenSymbol: string;
}

export interface OKXTokenResponse {
  code: string;
  msg?: string;
  data: OKXToken[];
}

export interface FormattedToken {
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  logoUrl: string;
}

/**
 * Get all supported tokens from OKX DEX API for a specific chain
 * @param chainId The chain ID to fetch tokens for
 * @returns Promise<FormattedToken[]> Array of formatted token data
 */
export async function getOKXSupportedTokens(chainId: number): Promise<FormattedToken[]> {
  try {
    const getRequestPath = '/api/v5/dex/aggregator/all-tokens';
    const getParams = {
      chainIndex: chainId
    };

    const response: OKXTokenResponse = await OKX.sendGetRequest(getRequestPath, getParams);

    if (response.code !== "0") {
      throw new Error(`OKX API error: ${response.msg || 'Unknown error'}`);
    }

    // Format the response to include only relevant token information
    const tokens: FormattedToken[] = response.data.map((token: OKXToken) => ({
      symbol: token.tokenSymbol,
      name: token.tokenName,
      contractAddress: token.tokenContractAddress,
      decimals: parseInt(token.decimals),
      logoUrl: token.tokenLogoUrl
    }));

    return tokens;
  } catch (error) {
    throw new Error(`Failed to fetch OKX supported tokens: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Search for a specific token by symbol in the supported tokens list
 * @param chainId The chain ID to search in
 * @param symbol The token symbol to search for (case-insensitive)
 * @returns Promise<FormattedToken | null> The found token or null
 */
export async function findTokenBySymbol(chainId: number, symbol: string): Promise<FormattedToken | null> {
  try {
    const tokens = await getOKXSupportedTokens(chainId);
    const searchSymbol = symbol.toUpperCase();
    
    const foundToken = tokens.find(token => token.symbol.toUpperCase() === searchSymbol);
    return foundToken || null;
  } catch (error) {
    throw new Error(`Failed to find token by symbol: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get token information by contract address
 * @param chainId The chain ID to search in
 * @param contractAddress The contract address to search for
 * @returns Promise<FormattedToken | null> The found token or null
 */
export async function findTokenByAddress(chainId: number, contractAddress: string): Promise<FormattedToken | null> {
  try {
    const tokens = await getOKXSupportedTokens(chainId);
    const searchAddress = contractAddress.toLowerCase();
    
    const foundToken = tokens.find(token => token.contractAddress.toLowerCase() === searchAddress);
    return foundToken || null;
  } catch (error) {
    throw new Error(`Failed to find token by address: ${error instanceof Error ? error.message : String(error)}`);
  }
}
