#!/usr/bin/env node
import { config } from 'dotenv';
import { getPrivateKeyAsHex } from './src/core/config.js';
import { getPublicClient } from './src/core/services/clients.js';
import { erc20Abi, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createMeeClient, toMultichainNexusAccount } from "@biconomy/abstractjs";
import { base, optimism } from 'viem/chains';
import { http } from 'viem';

// Load environment variables from .env file
config();

async function transferWETHFromMEE() {
  try {
    console.log('Transferring WETH from MEE smart account to EOA...');
    
    const privateKey = getPrivateKeyAsHex();
    const publicClient = getPublicClient('optimism');
    
    // Get address from private key
    const eoa = privateKeyToAccount(privateKey);
    const userAddress = eoa.address;
    
    // MEE smart account address (from transaction logs)
    const meeAccountAddress = '0xf01b1746343f051572a4cc47fbf9eed5150f1b32';
    
    // Optimism WETH contract address
    const wethAddress = '0x4200000000000000000000000000000000000006'; // WETH on Optimism
    
    console.log(`EOA address: ${userAddress}`);
    console.log(`MEE account address: ${meeAccountAddress}`);
    console.log(`WETH contract: ${wethAddress}`);
    
    // Check current WETH balance in MEE account
    const meeBalance = await publicClient.readContract({
      address: wethAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [meeAccountAddress]
    });
    
    console.log(`MEE WETH Balance: ${Number(meeBalance) / Math.pow(10, 18)} WETH`);
    console.log(`Raw MEE balance: ${meeBalance.toString()}`);
    
    if (meeBalance === 0n) {
      console.log('No WETH in MEE account to transfer');
      return;
    }
    
    // Create multichain nexus account
    const orchestrator = await toMultichainNexusAccount({
      chains: [base, optimism],
      transports: [http(), http()],
      signer: eoa
    });
    
    // Create MEE client
    const meeClient = await createMeeClient({
      account: orchestrator
    });
    
    // Build transfer transaction
    const transfer = await orchestrator.buildComposable({
      type: 'default',
      data: {
        abi: erc20Abi,
        chainId: 10, // Optimism
        to: wethAddress,
        functionName: 'transfer',
        args: [
          userAddress,  // Transfer to EOA
          meeBalance    // Transfer full balance
        ]
      }
    });
    
    console.log('Building fusion quote for transfer...');
    
    // Get fusion quote for the transfer
    const fusionQuote = await meeClient.getFusionQuote({
      instructions: [transfer],
      trigger: {
        chainId: 10,
        tokenAddress: wethAddress,
        amount: 0n // No trigger amount needed
      },
      feeToken: {
        address: wethAddress, // Use WETH to pay gas
        chainId: 10
      }
    });
    
    console.log('Executing transfer...');
    
    // Execute the transfer
    const { hash } = await meeClient.executeFusionQuote({
      fusionQuote
    });
    
    console.log(`✅ Transfer initiated! Hash: ${hash}`);
    
    // Wait for receipt
    const receipt = await meeClient.waitForSupertransactionReceipt({ hash });
    
    console.log('✅ Transfer completed!');
    console.log(`Transaction Hash: ${hash}`);
    
    // Check final balances
    const finalMeeBalance = await publicClient.readContract({
      address: wethAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [meeAccountAddress]
    });
    
    const finalEoaBalance = await publicClient.readContract({
      address: wethAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress]
    });
    
    console.log(`\nFinal Balances:`);
    console.log(`MEE WETH Balance: ${Number(finalMeeBalance) / Math.pow(10, 18)} WETH`);
    console.log(`EOA WETH Balance: ${Number(finalEoaBalance) / Math.pow(10, 18)} WETH`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

transferWETHFromMEE();
