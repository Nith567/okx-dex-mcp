// @ts-ignore
import { aave, createMeeClient, getMeeScanLink, toMultichainNexusAccount, type Trigger } from "@biconomy/abstractjs";
import { getPrivateKeyAsHex } from '../config.js';
import { erc20Abi, http, parseAbi, parseUnits, type Hex, decodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, optimism, mainnet ,xLayer} from "viem/chains";
import * as OKX from '../../lib/okx.js';
import { getOKXSupportedTokens, findTokenBySymbol } from './supported-tokens.js';
import { resolveChainId, getChain } from '../chains.js';
import { getWalletClient } from './clients.js';

// Import DEX Router ABI
import dexRouterAbi from '../../abi/dexRouter.json' with { type: 'json' };

// Constants
const SLIPPAGE = '0.05'; // 5% slippage
const SUPPORTED_CHAINS = [optimism, base, mainnet,xLayer];

// Type definitions
interface SwapParams {
  network: string;
  amount: string;
  fromTokenSymbol: string;
  toTokenSymbol: string;
}

interface ApprovalResult {
  dexContractAddress: string;
  amount: bigint;
  txData: string;
}

interface SwapResult {
  toAddress: string;
  functionName: string;
  args: any[];
  txData: string;
  toTokenAmount: string; 
  minReceiveAmount: string;
}

/**
 * Get OKX approval transaction data
 */
export async function getApprovalTransaction(
  chainId: number,
  tokenContractAddress: string,
  approveAmount: string
): Promise<ApprovalResult> {
  try {
    const requestPath = '/api/v5/dex/aggregator/approve-transaction';
    const params = {
      chainIndex: chainId,
      tokenContractAddress,
      approveAmount
    };

    const response = await OKX.sendGetRequest(requestPath, params);

    if (response.code !== "0") {
      throw new Error(`OKX API error: ${response.msg || 'Unknown error'}`);
    }

    const txData = response.data[0].data;
    const dexContractAddress = response.data[0].dexContractAddress;

    // Decode the approval transaction
    const abi = parseAbi(['function approve(address spender, uint256 amount)']);
    const decoded = decodeFunctionData({ abi, data: txData });

    return {
      dexContractAddress,
      amount: decoded.args[1] as bigint,
      txData
    };
  } catch (error) {
    throw new Error(`Failed to get approval transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get OKX swap transaction data
 */
export async function getSwapTransaction(
  chainId: number,
  amount: string,
  fromTokenAddress: string,
  toTokenAddress: string,
  userWalletAddress: string
): Promise<SwapResult> {
  try {
    const requestPath = '/api/v5/dex/aggregator/swap';
    const params = {
      chainIndex: chainId,
      amount,
      toTokenAddress,
      fromTokenAddress,
      slippage: SLIPPAGE,
      userWalletAddress
    //   fromTokenReferrerWalletAddress: "0xOurAddress",
// feePercent: "1.1", // ← means 1.1% fee to earn slight percentage profit 
//phantom made revenue over millions via fees so we are thinking to expand by providing mcp service.
    };

    const response = await OKX.sendGetRequest(requestPath, params);

    if (response.code !== "0") {
      throw new Error(`OKX API error: ${response.msg || 'Unknown error'}`);
    }

    const txData = response.data[0].tx.data;
    const toAddress = response.data[0].tx.to;
    const toTokenAmount = response.data[0].routerResult?.toTokenAmount; // Get from routerResult
    const minReceiveAmount = response.data[0].tx.minReceiveAmount; // Get minimum receive amount

    // Decode the swap transaction data
    const decoded = decodeFunctionData({
      abi: dexRouterAbi.DexrouterAbi,
      data: txData
    });

    return {
      toAddress,
      functionName: decoded.functionName,
      args: [...(decoded.args || [])], // Convert readonly to mutable array
      txData,
      toTokenAmount,
      minReceiveAmount
    };
  } catch (error) {
    throw new Error(`Failed to get swap transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Execute token swap using OKX DEX and Biconomy MEE
 */
export async function executeTokenSwap(params: SwapParams): Promise<{
  success: boolean;
  hash?: string;
  meeScanLink?: string;
  receipt?: any;
  error?: string;
}> {
  try {
    const { network, amount, fromTokenSymbol, toTokenSymbol } = params;

    // 1. Get chain ID and validate network
    const chainId = resolveChainId(network);
    const chain = getChain(network);

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

        // 4. Calculate amount with decimals (use parseUnits like in the example)
    const amountWithDecimals = parseUnits(amount, fromToken.decimals);

    // 5. Get private key and create account
    const privateKey = getPrivateKeyAsHex();
    if (!privateKey) {
      throw new Error('Private key not available. Set the PRIVATE_KEY environment variable.');
    }

    const eoa = privateKeyToAccount(privateKey as Hex);
    const client = getWalletClient(privateKey, network);
    const userWalletAddress = client.account?.address;
    if (!userWalletAddress) {
      throw new Error('Failed to get wallet address from client');
    }

    // 5.5. Create multichain nexus account (only include the chain we're actually using)
    const chainsToUse = [chain]; // Only use the chain we're swapping on
    const transportsToUse = [http()]; // One transport per chain
    
    const orchestrator = await toMultichainNexusAccount({
      chains: chainsToUse,
      transports: transportsToUse,
      signer: eoa
    });
    
    // For now, let's use the user wallet address for the OKX API
    // The MEE will handle the actual execution context
    const meeAccountAddress = userWalletAddress;

    // 6. Get approval transaction data
    const approvalData = await getApprovalTransaction(
      chainId,
      fromToken.contractAddress,
      amountWithDecimals.toString()
    );

    // 7. Get swap transaction data (MEE smart account will execute but we'll transfer after)
    const swapData = await getSwapTransaction(
      chainId,
      amountWithDecimals.toString(),
      fromToken.contractAddress,
      toToken.contractAddress,
      userWalletAddress 
    );

    // 8. Create MEE client
    const meeClient = await createMeeClient({
      account: orchestrator
    });

    // 9. Build approval transaction
    const approve = await orchestrator.buildComposable({
      type: 'default',
      data: {
        abi: erc20Abi,
        chainId: chain.id,
        to: fromToken.contractAddress as Hex,
        functionName: 'approve',
        args: [
          approvalData.dexContractAddress as Hex,
          approvalData.amount
        ]
      }
    });

    // 10. Build swap transaction - use original args from OKX (they already include correct recipient)
    const swap = await orchestrator.buildComposable({
      type: 'default',
      data: {
        abi: dexRouterAbi.DexrouterAbi,
        to: swapData.toAddress as Hex,
        chainId: chain.id,
        functionName: swapData.functionName,
        args: swapData.args // Use original args from OKX - they should be correct
      }
    });

    // 11. Build transfer transaction to send swapped tokens from MEE to EOA
    // Use a reasonable estimate based on the minimum receive amount
    const transferAmount = BigInt(swapData.minReceiveAmount);
    
    const transfer = await orchestrator.buildComposable({
      type: 'default',
      data: {
        abi: erc20Abi,
        chainId: chain.id,
        to: toToken.contractAddress as Hex,
        functionName: 'transfer',
        args: [
          eoa.address as Hex,  // Transfer to EOA
          transferAmount  // Use minimum receive amount as safe estimate
        ]
      }
    });

    // 12. Create trigger (use the full amount like in the example)
    const trigger: Trigger = {
      chainId: chain.id,
      tokenAddress: fromToken.contractAddress as Hex,
      amount: amountWithDecimals
    };

    // 13. Get fusion quote with approve, swap, and transfer
    const fusionQuote = await meeClient.getFusionQuote({
      instructions: [approve, swap, transfer], // Add transfer to send tokens to EOA
      trigger: trigger,
      feeToken: {
        address: fromToken.contractAddress as Hex,
        chainId: chain.id
      }
    });

    // 14. Execute the swap (using correct API)
    const { hash } = await meeClient.executeFusionQuote({
      fusionQuote
    });

    const meeScanLink = getMeeScanLink(hash);

    // 15. Wait for receipt
    const receipt = await meeClient.waitForSupertransactionReceipt({ hash });

    // Convert BigInt values to strings for JSON serialization
    const serializableReceipt = JSON.parse(JSON.stringify(receipt, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return {
      success: true,
      hash,
      meeScanLink,
      receipt: serializableReceipt
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
