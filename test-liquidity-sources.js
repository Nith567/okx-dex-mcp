// Test the new liquidity sources API
import * as OKX from './src/lib/okx.js';

async function testLiquiditySources() {
  console.log("🧪 Testing OKX DEX Liquidity Sources API...\n");
  
  const chains = [
    { id: 8453, name: 'Base' },
    { id: 10, name: 'Optimism' },
    { id: 1, name: 'Ethereum' },
    { id: 196, name: 'xLayer' }
  ];
  
  for (const chain of chains) {
    try {
      console.log(`🔍 Fetching liquidity sources for ${chain.name} (Chain ID: ${chain.id})...`);
      
      const requestPath = '/api/v5/dex/aggregator/get-liquidity';
      const params = {
        chainIndex: chain.id
      };

      const response = await OKX.sendGetRequest(requestPath, params);
      
      if (response.code === "0") {
        console.log(`✅ ${chain.name}: Found ${response.data.length} liquidity sources`);
        
        // Show first few sources as example
        const sampleSources = response.data.slice(0, 5);
        sampleSources.forEach(source => {
          console.log(`   • ${source.name} (ID: ${source.id})`);
        });
        
        if (response.data.length > 5) {
          console.log(`   ... and ${response.data.length - 5} more\n`);
        }
      } else {
        console.log(`❌ ${chain.name}: API error - ${response.msg}\n`);
      }
      
    } catch (error) {
      console.log(`❌ ${chain.name}: Error - ${error.message}\n`);
    }
  }
}

testLiquiditySources().catch(console.error);
