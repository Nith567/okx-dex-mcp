#!/usr/bin/env node
import { tokenSwap } from './src/core/services/token-swap.js';

async function testFullSwap() {
  console.log('Testing full token swap function...');
  
  const params = {
    amount: "0.1",
    fromTokenAddress: "0x0b2c639c533813f4aa9d7837caf62653d097ff85", // USDC
    toTokenAddress: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58", // USDT
    slippageTolerance: "1",
    network: "optimism"
  };
  
  try {
    console.log('Network:', params.network);
    console.log('Amount:', params.amount, 'USDC -> USDT');
    
    const result = await tokenSwap(params);
    
    if (result.success) {
      console.log('✅ Swap successful!');
      console.log('Transaction Hash:', result.hash);
      if (result.meeScanLink) {
        console.log('MEE Scan Link:', result.meeScanLink);
      }
    } else {
      console.log('❌ Swap failed:', result.error);
    }
    
    console.log('\n📊 Full result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFullSwap();
