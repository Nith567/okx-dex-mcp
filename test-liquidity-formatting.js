// Test the new liquidity sources service with formatting
import { getLiquiditySources, formatLiquiditySources } from './src/core/services/liquidity-sources.js';

async function testLiquiditySourcesFormatting() {
  console.log("🧪 Testing OKX DEX Liquidity Sources Service...\n");
  
  try {
    console.log("🔍 Fetching liquidity sources for Base (Chain ID: 8453)...");
    
    const sources = await getLiquiditySources(8453);
    const formatted = formatLiquiditySources(sources, 8453);
    
    console.log("\n" + formatted);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testLiquiditySourcesFormatting().catch(console.error);
