import { getOKXSupportedTokens } from './src/core/services/supported-tokens.js';
import { getApprovalTransaction, getSwapTransaction } from './src/core/services/token-swap.js';
import { resolveChainId } from './src/core/chains.js';

async function testOKXOnly() {
  try {
    console.log('Testing OKX API integration only...');
    
    const network = 'optimism';
    const chainId = resolveChainId(network);
    console.log(`Network: ${network} (Chain ID: ${chainId})`);

    // 1. Test getting supported tokens
    console.log('\n1. Getting supported tokens...');
    const tokens = await getOKXSupportedTokens(chainId);
    console.log(`Found ${tokens.length} supported tokens`);
    
    // Find USDC and WETH
    const usdc = tokens.find(t => t.symbol.toUpperCase() === 'USDC');
    const weth = tokens.find(t => t.symbol.toUpperCase() === 'WETH');
    
    if (!usdc) {
      console.log('❌ USDC not found in supported tokens');
      console.log('Available tokens:', tokens.map(t => t.symbol).join(', '));
      return;
    }
    if (!weth) {
      console.log('❌ WETH not found in supported tokens');
      console.log('Available tokens:', tokens.map(t => t.symbol).join(', '));
      return;
    }

    console.log(`✅ Found USDC: ${usdc.contractAddress}`);
    console.log(`✅ Found WETH: ${weth.contractAddress}`);

    // 2. Test approval transaction
    console.log('\n2. Getting approval transaction...');
    const amount = '0.1';
    const amountWithDecimals = (parseFloat(amount) * Math.pow(10, usdc.decimals)).toString();
    
    const approvalData = await getApprovalTransaction(
      chainId,
      usdc.contractAddress,
      amountWithDecimals
    );
    console.log('✅ Approval data received:', {
      dexContract: approvalData.dexContractAddress,
      amount: approvalData.amount.toString()
    });

    // 3. Test swap transaction
    console.log('\n3. Getting swap transaction...');
    const swapData = await getSwapTransaction(
      chainId,
      amountWithDecimals,
      usdc.contractAddress,
      weth.contractAddress,
      "0x1234567890123456789012345678901234567890" // dummy address
    );
    console.log('✅ Swap data received:', {
      toAddress: swapData.toAddress,
      functionName: swapData.functionName,
      argsCount: swapData.args.length
    });

    console.log('\n🎉 OKX API integration working correctly!');
    console.log('The issue is with Biconomy MEE integration, not OKX API.');

  } catch (error) {
    console.error('❌ OKX API test failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

testOKXOnly();
