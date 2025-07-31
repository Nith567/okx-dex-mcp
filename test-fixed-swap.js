// Fixed token swap with proper MEE usage
import { executeTokenSwap } from './src/core/services/token-swap.js';
import { createMeeClient, toMultichainNexusAccount } from "@biconomy/abstractjs";
import { privateKeyToAccount } from "viem/accounts";
import { http, erc20Abi, parseUnits } from "viem";
import { optimism, base, mainnet } from "viem/chains";
import { getPrivateKeyAsHex } from './src/core/config.js';
import { getOKXSupportedTokens } from './src/core/services/supported-tokens.js';
import { getApprovalTransaction, getSwapTransaction } from './src/core/services/token-swap.js';
import { resolveChainId } from './src/core/chains.js';

async function fixedTokenSwap() {
  try {
    console.log('🔄 Testing fixed token swap with MEE...');
    console.log('Network: base');
    console.log('Amount: 0.1 USDC -> WETH');
    console.log('Using MEE for gasless execution with USDC fees');
    
    const network = 'base';
    const amount = '0.1';
    const fromTokenSymbol = 'USDC';
    const toTokenSymbol = 'WETH';
    
    // 1. Setup
    const chainId = resolveChainId(network);
    const privateKey = getPrivateKeyAsHex();
    const eoa = privateKeyToAccount(privateKey);
    const userAddress = eoa.address;
    
    console.log(`👤 User address: ${userAddress}`);
    
    // 2. Use specific Base chain token addresses
    const fromToken = {
      symbol: 'USDC',
      contractAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      decimals: 6
    };
    const toToken = {
      symbol: 'WETH', 
      contractAddress: '0x4200000000000000000000000000000000000006',
      decimals: 18
    };
    
    console.log(`✅ Using specific token addresses:`);
    console.log(`USDC: ${fromToken.contractAddress} (${fromToken.decimals} decimals)`);
    console.log(`WETH: ${toToken.contractAddress} (${toToken.decimals} decimals)`);
    
    // 3. Setup MEE with debugging
    console.log('\n🔧 Setting up MEE with chain debugging...');
    console.log('Base chain info:', {
      id: base.id,
      name: base.name,
      nativeCurrency: base.nativeCurrency.symbol
    });
    
    const SUPPORTED_CHAINS = [base]; // Start with just Base chain
    const orchestrator = await toMultichainNexusAccount({
      chains: SUPPORTED_CHAINS,
      transports: SUPPORTED_CHAINS.map(() => http()),
      signer: eoa
    });
    
    console.log('✅ MEE orchestrator created');
    console.log('Orchestrator deployments:', Object.keys(orchestrator.deployments || {}));
    
    // Check if Base chain is properly recognized
    try {
      const baseAddress = orchestrator.addressOn(base.id);
      console.log(`Base address from orchestrator: ${baseAddress}`);
    } catch (addrError) {
      console.log('❌ Failed to get Base address:', addrError.message);
    }
    
    // 4. Create MEE client
    const meeClient = await createMeeClient({
      account: orchestrator
    });
    
    console.log('✅ MEE client created');
    
    // 5. Get OKX transaction data
    const amountWithDecimals = (parseFloat(amount) * Math.pow(10, fromToken.decimals)).toString();
    
    console.log('\n📡 Getting OKX transaction data...');
    const approvalData = await getApprovalTransaction(
      chainId,
      fromToken.contractAddress,
      amountWithDecimals
    );
    
    const swapData = await getSwapTransaction(
      chainId,
      amountWithDecimals,
      fromToken.contractAddress,
      toToken.contractAddress,
      userAddress
    );
    
    console.log('✅ OKX data retrieved');
    
    // 6. Build MEE transactions (this is where it might fail)
    console.log('\n🔨 Building MEE transactions...');
    
    try {
      // Build approval with explicit chain reference
      const approve = await orchestrator.buildComposable({
        type: 'default',
        data: {
          abi: erc20Abi,
          chainId: 8453, // Use Base chain ID (8453)
          to: fromToken.contractAddress,
          functionName: 'approve',
          args: [
            approvalData.dexContractAddress,
            approvalData.amount
          ]
        }
      });
      
      console.log('✅ Approval transaction built');
      
      console.log('\n🎯 This is where the issue might occur...');
      console.log('If it fails here, the problem is in MEE execution, not setup.');
      
      // Try to execute just the approval first
      console.log('\n⚡ Attempting MEE execution...');
      
      // Create trigger for gasless execution with proper chain specification
      const trigger = {
        type: 'tokensReceived',
        data: {
          token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // Explicit USDC address
          amount: parseUnits(amount, 6), // USDC has 6 decimals
          chainId: 8453 // Base chain ID
        }
      };
      
      console.log('🔗 Creating fusion quote...');
      console.log('Chain ID being used:', 8453);
      console.log('Base chain from viem:', base.id);
      console.log('Trigger data:', {
        chainId: trigger.data.chainId,
        token: trigger.data.token,
        amount: trigger.data.amount.toString()
      });
      
      // Check what the approve instruction contains
      console.log('\n📋 Checking approve instruction...');
      console.log('Approve instruction type:', typeof approve);
      console.log('Approve instruction keys:', Object.keys(approve));
      if (approve.data) {
        console.log('Approve data chainId:', approve.data.chainId);
      }
      
      // First try without gasToken parameter to see if that's the issue
      console.log('\n🚀 Trying fusion quote WITHOUT gasToken...');
      try {
        const quote = await meeClient.getFusionQuote({
          instructions: [approve],
          trigger
        });
        
        console.log('✅ Fusion quote received (without gasToken)!');
        console.log('💰 Quote details:', {
          quoteId: quote.quoteId
        });
        
      } catch (noGasTokenError) {
        console.log('❌ Failed without gasToken:', noGasTokenError.message);
        
        console.log('\n🚀 Trying fusion quote WITH gasToken...');
        try {
          const quote = await meeClient.getFusionQuote({
            instructions: [approve],
            trigger,
            gasToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' // Explicit USDC address
          });
          
          console.log('✅ Fusion quote received (with gasToken)!');
          
        } catch (withGasTokenError) {
          console.log('❌ Failed with gasToken:', withGasTokenError.message);
        }
      }
        token: trigger.data.token,
        amount: trigger.data.amount.toString()
      });
      
      const quote = await meeClient.getFusionQuote({
        instructions: [approve],
        trigger,
        gasToken: fromToken.contractAddress // Specify USDC as gas token explicitly
      });
      
      console.log('✅ Fusion quote received!');
      console.log('💰 Quote details:', {
        quoteId: quote.quoteId,
        // Add other relevant quote details
      });
      
      console.log('\n� Executing fusion quote...');
      const result = await meeClient.executeFusionQuote(quote.quoteId);
      
      console.log('🎉 MEE execution successful!');
      console.log('✅ Transaction hash:', result.transactionHash);
      console.log('🔗 MEE scan link:', result.meeScanLink);
      
    } catch (buildError) {
      console.log('❌ Failed during transaction building:', buildError.message);
      console.log('This confirms the issue is in MEE transaction execution.');
    }
    
  } catch (error) {
    console.error('❌ Fixed swap failed:', error.message);
    console.log('\n💡 Even with MEE working, there might be:');
    console.log('1. Network-specific issues with Biconomy contracts');
    console.log('2. Version compatibility problems');
    console.log('3. Configuration issues');
  }
}

fixedTokenSwap();
