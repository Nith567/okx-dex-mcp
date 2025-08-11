//@ts-ignore
import { aave, createMeeClient, getMeeScanLink, runtimeERC20BalanceOf, greaterThanOrEqualTo, toMultichainNexusAccount, type Trigger } from "@biconomy/abstractjs";
import { getPublicClient } from "./clients.js";
import { getPrivateKeyAsHex } from '../config.js';
import { erc20Abi, http, parseUnits, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { executeTokenSwap } from './token-swap.js';
import { getWalletClient } from './clients.js';
import { MorphoPoolAbi } from "../../abi/morpho.js";

export const weth_Base: `0x${string}` = "0x4200000000000000000000000000000000000006";
export const weth_Re7_Morpho_Pool: `0x${string}` = "0xA2Cac0023a4797b4729Db94783405189a4203AFc";

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


    // Calculate slippage constraint for WETH (18 decimals)
    const SLIPPAGE_TOLERANCE_PERCENTAGE = 20; // or your preferred value
    const amountConsumed = parseUnits(depositAmount, 18); // WETH is 18 decimals
    const minAmountAfterSlippage =
      (amountConsumed * BigInt(100 - SLIPPAGE_TOLERANCE_PERCENTAGE)) / 100n;
    const executionConstraints = [greaterThanOrEqualTo(minAmountAfterSlippage)];

    const approveAmount = parseUnits(depositAmount, 18);
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

    // Deposit WETH
    const depositArgAmount = runtimeERC20BalanceOf({
        targetAddress: orchestrator.addressOn(base.id, true),
        tokenAddress: weth_Base,
        constraints: executionConstraints, // 🔹 added deadline
    });

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

    const triggerAmount = parseUnits(depositAmount, 18);
    const trigger: Trigger = {
        chainId: base.id,
        tokenAddress: weth_Base as Hex,
        amount: triggerAmount
    };

    const meeClient = await createMeeClient({ account: orchestrator });

    // 🔹 Get quote & execute immediately (minimizing delay)
    const fusionQuoteReq = {
        instructions: [approveMorphoVaultToSpendWeth, supplyToMorpho],
        trigger,
        feeToken: {
            address: weth_Base as Hex,
            chainId: base.id
        }
    };


    const fusionQuote = await meeClient.getFusionQuote(fusionQuoteReq);

    const { hash } = await meeClient.executeFusionQuote({
        fusionQuote,
    });

    const meeScanLink = getMeeScanLink(hash);
    const receipt = await meeClient.waitForSupertransactionReceipt({ hash });
    const serializableReceipt = JSON.parse(JSON.stringify(receipt, (k, v) => typeof v === 'bigint' ? v.toString() : v));

    return {
        success: true,
        hash,
        meeScanLink,
        receipt: serializableReceipt
    };
}
