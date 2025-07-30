// Test Biconomy MEE setup specifically
import { createMeeClient, toMultichainNexusAccount } from "@biconomy/abstractjs";
import { privateKeyToAccount } from "viem/accounts";
import { http } from "viem";
import { optimism, base, mainnet } from "viem/chains";
import { getPrivateKeyAsHex } from './src/core/config.js';

async function testBiconomyMEE() {
  try {
    console.log('🔍 Testing Biconomy MEE setup...');
    
    const privateKey = getPrivateKeyAsHex();
    if (!privateKey) {
      throw new Error('Private key not available');
    }
    
    const eoa = privateKeyToAccount(privateKey);
    console.log(`👤 EOA Address: ${eoa.address}`);
    
    console.log('\n📡 Creating multichain nexus account...');
    const SUPPORTED_CHAINS = [optimism, base, mainnet];
    
    try {
      const orchestrator = await toMultichainNexusAccount({
        chains: SUPPORTED_CHAINS,
        transports: SUPPORTED_CHAINS.map(() => http()),
        signer: eoa
      });
      
      console.log('✅ Multichain nexus account created successfully!');
      console.log('Orchestrator properties:', Object.getOwnPropertyNames(orchestrator));
      console.log('Orchestrator methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(orchestrator)));
      
      // Check if we can access the account address directly
      console.log('\n🔍 Checking orchestrator properties...');
      if (orchestrator.account) {
        console.log(`📧 Orchestrator account: ${orchestrator.account.address}`);
      }
      
      // Try to create MEE client without calling accountId
      console.log('\n🚀 Creating MEE client...');
      const meeClient = await createMeeClient({
        account: orchestrator
      });
      console.log('✅ MEE client created successfully!');
      
      console.log('\n🎉 Biconomy MEE setup is working correctly!');
      console.log('We can proceed without calling accountId().');
      
    } catch (orchestratorError) {
      console.log('❌ Failed to create multichain nexus account:', orchestratorError.message);
    }
    
  } catch (error) {
    console.error('❌ Biconomy MEE test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testBiconomyMEE();
