#!/usr/bin/env node
import { config } from 'dotenv';
import { getPrivateKeyAsHex } from './src/core/config.js';
import { getPublicClient } from './src/core/services/clients.js';
import { erc20Abi } from 'viem';

// Load environment variables from .env file
config();

async function checkWETHBalanceOptimism() {
  try {
    console.log('Checking WETH balance on Optimism...');
    
    const privateKey = getPrivateKeyAsHex();
    const publicClient = getPublicClient('optimism');
    
    // Get address from private key
    const { privateKeyToAccount } = await import('viem/accounts');
    const account = privateKeyToAccount(privateKey);
    const userAddress = account.address;
    
    // MEE smart account address (from transaction logs)
    const meeAccountAddress = '0xf01b1746343f051572a4cc47fbf9eed5150f1b32';
    
    // Optimism WETH contract address
    const wethAddress = '0x4200000000000000000000000000000000000006'; // WETH on Optimism
    
    console.log(`EOA address: ${userAddress}`);
    console.log(`MEE account address: ${meeAccountAddress}`);
    console.log(`WETH contract: ${wethAddress}`);
    
    // Check WETH balance in both addresses
    const eoa_balance = await publicClient.readContract({
      address: wethAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress]
    });
    
    const mee_balance = await publicClient.readContract({
      address: wethAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [meeAccountAddress]
    });
    
    // Also get token symbol to verify we're checking the right contract
    const symbol = await publicClient.readContract({
      address: wethAddress,
      abi: erc20Abi,
      functionName: 'symbol',
      args: []
    });
    
    // Convert to human readable (18 decimals for WETH)
    const eoa_balanceInWETH = Number(eoa_balance) / Math.pow(10, 18);
    const mee_balanceInWETH = Number(mee_balance) / Math.pow(10, 18);
    
    console.log(`\nToken Symbol: ${symbol}`);
    console.log(`📊 EOA WETH Balance: ${eoa_balanceInWETH} WETH`);
    console.log(`📊 MEE Account WETH Balance: ${mee_balanceInWETH} WETH`);
    console.log(`Raw EOA balance: ${eoa_balance.toString()}`);
    console.log(`Raw MEE balance: ${mee_balance.toString()}`);
    
    const expectedAmount = 0.000026;
    const actualAmount = mee_balanceInWETH;
    
    if (actualAmount > 0) {
      console.log(`🎉 Success! WETH found in MEE account: ${actualAmount} WETH`);
      console.log(`💰 Expected: ~${expectedAmount} WETH, Actual: ${actualAmount} WETH`);
      console.log(`� Note: WETH is in your MEE smart account, you can withdraw it to your EOA if needed`);
    } else if (eoa_balanceInWETH > 0) {
      console.log(`🎉 Success! WETH found in EOA: ${eoa_balanceInWETH} WETH`);
    } else {
      console.log(`⚠️  No WETH found in either account...`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkWETHBalanceOptimism();
