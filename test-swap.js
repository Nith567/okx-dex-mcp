

// Load environment variables
import { config } from 'dotenv';
import { executeTokenSwap } from './src/core/services/token-swap.js';

// Load environment variables from .env file
config();

async function testSwap() {
  try {
    console.log('Testing token swap...');
    console.log('Network: optimism');
    console.log('Amount: 0.05 USDC -> WETH (testing recipient fix)');
    
    const result = await executeTokenSwap({
      network: 'optimism',
      amount: '0.1', 
      fromTokenSymbol: 'USDT',
      toTokenSymbol: 'USDC' 
    });
    if (result.success) {
      console.log('✅ Swap successful!');
      console.log('Transaction Hash:', result.hash);
      console.log('MEE Scan Link:', result.meeScanLink);
    } else {
      console.log('❌ Swap failed:', result.error);
    }

    console.log('\n📊 Full result:', JSON.stringify(result, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2
    ));
  } catch (error) {
    console.error('💥 Test failed with exception:', error);
    console.error('Stack trace:', error.stack);
  }
}


testSwap();
