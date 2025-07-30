#!/usr/bin/env node
import { getPrivateKeyAsHex } from './src/core/config.js';
import { getPublicClient } from './src/core/services/clients.js';
import { erc20Abi } from 'viem';

async function checkWETHBalance() {
  try {
    console.log('Checking WETH balance on Base...');
    
    const privateKey = getPrivateKeyAsHex();
    const publicClient = getPublicClient('base');
    
    // Get address from private key
    const { privateKeyToAccount } = await import('viem/accounts');
    const account = privateKeyToAccount(privateKey);
    const userAddress = account.address;
    
    // Base WETH contract address (let's verify this is correct)
    const wethAddress = '0x4200000000000000000000000000000000000006'; // WETH on Base
    
    console.log(`User address: ${userAddress}`);
    console.log(`WETH contract: ${wethAddress}`);
    
    // Get WETH balance
    const balance = await publicClient.readContract({
      address: wethAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress]
    });
    
    // Also get token symbol to verify we're checking the right contract
    const symbol = await publicClient.readContract({
      address: wethAddress,
      abi: erc20Abi,
      functionName: 'symbol',
      args: []
    });
    
    // Convert to human readable (18 decimals for WETH)
    const balanceInWETH = Number(balance) / Math.pow(10, 18);
    
    console.log(`\nToken Symbol: ${symbol}`);
    console.log(`📊 WETH Balance: ${balanceInWETH} WETH`);
    console.log(`Raw balance: ${balance.toString()}`);
    
    if (balanceInWETH > 0) {
      console.log(`🎉 Success! You have ${balanceInWETH} WETH`);
    } else {
      console.log(`⚠️  No WETH found. Let's check if this is the right contract...`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkWETHBalance();
