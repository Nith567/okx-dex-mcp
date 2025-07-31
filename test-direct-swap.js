// MEE gasless swap implementation using USDC as gas token
import { config } from 'dotenv';
import { executeTokenSwap } from './src/core/services/token-swap.js';

// Load environment variables from .env file
config();

async function executeMEESwap() {
  try {
    console.log('Testing MEE gasless swap (USDC pays gas fees)...');
    
    const network = 'base';
    const amount = '0.2';
    const fromTokenSymbol = 'USDC';
    const toTokenSymbol = 'WETH';
    
    console.log(`Swapping ${amount} ${fromTokenSymbol} -> ${toTokenSymbol} on ${network}`);
    console.log('Using MEE: USDC will pay for gas fees (gasless for user)');

    const params = {
      network,
      amount,
      fromTokenSymbol,
      toTokenSymbol
    };
    
    const result = await executeTokenSwap(params);
    
    if (result.success) {
      console.log('✅ MEE swap successful!');
      console.log('Transaction Hash:', result.hash);
      if (result.meeScanLink) {
        console.log('MEE Scan Link:', result.meeScanLink);
      }
    } else {
      console.log('❌ MEE swap failed:', result.error);
    }
    
    console.log('\n📊 Full result:', JSON.stringify(result, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2
    ));

  } catch (error) {
    console.error('❌ MEE swap failed:', error.message);
  }
}

executeMEESwap();
