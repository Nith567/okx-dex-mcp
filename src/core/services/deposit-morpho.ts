// @ts-ignore
import { aave, createMeeClient, getMeeScanLink,  runtimeERC20BalanceOf,toMultichainNexusAccount,runtimeERC20BalanceOf, type Trigger } from "@biconomy/abstractjs";
import { getPrivateKeyAsHex } from '../config.js';
import { erc20Abi, http, parseUnits, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { getOKXSupportedTokens } from './supported-tokens.js';
import { executeTokenSwap } from './token-swap.js';
import { getWalletClient } from './clients.js';

import { MorphoPoolAbi } from "../../abi/morpho.js";

// Token and pool addresses/types
export const weth_Base: `0x${string}` = "0x4200000000000000000000000000000000000006";
export const weth_Re7_Morpho_Pool: `0x${string}` = "0xA2Cac0023a4797b4729Db94783405189a4203AFc";
export const morpho_re7_weth_Base: `0x${string}` = "0xA2Cac0023a4797b4729Db94783405189a4203AFc";

export type Erc20Token = {
    address: `0x${string}`;
    name: string;
    chain: typeof base;
}

export type Account = {
    name: string;
    address: `0x${string}`;
    tokens: Erc20Token[];
}

// Constraints placeholder (if needed)
const executionConstraints = {};

export async function swapAndDepositMorpho(params: {
    amount: string;
    fromTokenSymbol: string;
    userNetwork?: string;
}) {
  const { amount, fromTokenSymbol, userNetwork = 'base' } = params;

  let depositAmount = amount;
  if (fromTokenSymbol.toUpperCase() !== 'WETH') {
    const swapResult = await executeTokenSwap({
      network: userNetwork,
      amount,
      fromTokenSymbol,
      toTokenSymbol: 'WETH'
    });
    if (!swapResult.success) {
      return { success: false, error: swapResult.error || 'Swap failed' };
    }
    depositAmount = swapResult.receipt?.outputAmount || amount;
  }

  // Deposit WETH into Morpho
  const chain = base;
  const privateKey = getPrivateKeyAsHex();
  if (!privateKey) throw new Error('Private key not set');
  const eoa = privateKeyToAccount(privateKey as Hex);
  const client = getWalletClient(privateKey, userNetwork);
  const userWalletAddress = client.account?.address;
  if (!userWalletAddress) throw new Error('Failed to get wallet address');

  const orchestrator = await toMultichainNexusAccount({
    chains: [chain],
    transports: [http()],
    signer: eoa
  });


  // 1. Approve Morpho vault to spend WETH (static BigInt)
  const approveAmount = parseUnits(depositAmount, 18);
  console.log("[MORPHO] approveAmount (wei):", approveAmount.toString());
  const approveMorphoVaultToSpendWeth = await orchestrator.buildComposable({
    type: "approve",
    data: {
      chainId: base.id,
      tokenAddress: weth_Base,
      gasLimit: 200000n,
      spender: weth_Re7_Morpho_Pool,
      amount: approveAmount,
    },
  });

  // 2. Deposit WETH into Morpho (runtime for actual transfer)
  const depositArgAmount = runtimeERC20BalanceOf({
    targetAddress: orchestrator.addressOn(base.id, true),
    tokenAddress: weth_Base,
    constraints: executionConstraints,
  });
  console.log("[MORPHO] depositArgAmount (runtimeERC20BalanceOf):", depositArgAmount);
  const supplyToMorpho = await orchestrator.buildComposable({
    type: "default",
    data: {
      abi: MorphoPoolAbi,
      to: weth_Re7_Morpho_Pool,
      chainId: base.id,
      functionName: "deposit",
      args: [
        depositArgAmount,
        orchestrator.addressOn(base.id, true)
      ]
    }
  });


  // Use static BigInt for trigger amount
  const triggerAmount = parseUnits(depositAmount, 18);
  console.log("[MORPHO] triggerAmount (wei):", triggerAmount.toString());
  const trigger: Trigger = {
    chainId: base.id,
    tokenAddress: weth_Base as Hex,
    amount: triggerAmount
  };

  const meeClient = await createMeeClient({ account: orchestrator });

  const fusionQuoteReq = {
    instructions: [approveMorphoVaultToSpendWeth, supplyToMorpho],
    trigger,
    feeToken: {
      address: weth_Base as Hex,
      chainId: base.id
    }
  };
  console.log("[MORPHO] fusionQuote request:", JSON.stringify(fusionQuoteReq, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
  const fusionQuote = await meeClient.getFusionQuote(fusionQuoteReq);

  const { hash } = await meeClient.executeFusionQuote({ fusionQuote });
  const meeScanLink = getMeeScanLink(hash);
  const receipt = await meeClient.waitForSupertransactionReceipt({ hash });
  const serializableReceipt = JSON.parse(JSON.stringify(receipt, (key, value) => typeof value === 'bigint' ? value.toString() : value));

  return {
    success: true,
    hash,
    meeScanLink,
    receipt: serializableReceipt
  };
}
