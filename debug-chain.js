// Debug MEE chain recognition
import { createMeeClient, toMultichainNexusAccount } from "@biconomy/abstractjs";
import { privateKeyToAccount } from "viem/accounts";
import { http, erc20Abi, parseUnits } from "viem";
import { optimism, base, mainnet } from "viem/chains";
import { getPrivateKeyAsHex } from './src/core/config.js';

async function debugChainRecognition() {
  try {
    console.log('🔍 Debugging MEE chain recognition...');
    
    const privateKey = getPrivateKeyAsHex();
    const eoa = privateKeyToAccount(privateKey);
    
    console.log('\n📋 Chain configurations:');
    console.log('Base chain:', {
      id: base.id,
      name: base.name,
      nativeCurrency: base.nativeCurrency
    });
    console.log('Optimism chain:', {
      id: optimism.id,
      name: optimism.name,
      nativeCurrency: optimism.nativeCurrency
    });
    console.log('Mainnet chain:', {
      id: mainnet.id,
      name: mainnet.name,
      nativeCurrency: mainnet.nativeCurrency
    });
    
    // Try with just Base chain first
    console.log('\n🔧 Testing with Base chain only...');
    try {
      const baseOrchestrator = await toMultichainNexusAccount({
        chains: [base],
        transports: [http()],
        signer: eoa
      });
      
      console.log('✅ Base-only orchestrator created');
      
      // Check what chains the orchestrator recognizes
      console.log('Base orchestrator deployments:', baseOrchestrator.deployments);
      
      // Try to get address on Base
      const baseAddress = baseOrchestrator.addressOn(base.id);
      console.log(`Base address: ${baseAddress}`);
      
      // Try building a simple transaction
      const testTx = await baseOrchestrator.buildComposable({
        type: 'default',
        data: {
          abi: erc20Abi,
          chainId: base.id,
          to: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC on Base
          functionName: 'balanceOf',
          args: [eoa.address]
        }
      });
      
      console.log('✅ Base transaction built successfully');
      
      // Try creating MEE client with Base only
      const baseMeeClient = await createMeeClient({
        account: baseOrchestrator
      });
      
      console.log('✅ Base MEE client created');
      
      // Try a simple fusion quote
      console.log('\n🚀 Testing fusion quote with Base chain...');
      
      const trigger = {
        type: 'tokensReceived',
        data: {
          token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC on Base
          amount: parseUnits('0.1', 6), // USDC has 6 decimals
          chainId: base.id
        }
      };
      
      console.log('Trigger with Base chain ID:', trigger.data.chainId);
      
      try {
        const quote = await baseMeeClient.getFusionQuote({
          instructions: [testTx],
          trigger,
          gasToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' // USDC as gas token
        });
        
        console.log('🎉 Fusion quote successful on Base!');
        console.log('Quote ID:', quote.quoteId);
        
      } catch (quoteError) {
        console.log('❌ Fusion quote failed:', quoteError.message);
        
        // Let's try without gasToken parameter
        console.log('\n🔄 Trying without explicit gasToken...');
        try {
          const quote2 = await baseMeeClient.getFusionQuote({
            instructions: [testTx],
            trigger
          });
          console.log('✅ Fusion quote without gasToken successful!');
        } catch (quote2Error) {
          console.log('❌ Still failed:', quote2Error.message);
        }
      }
      
    } catch (baseError) {
      console.log('❌ Base-only setup failed:', baseError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugChainRecognition();
