// Test multiple quote scenarios
import { getTokenSwapQuote, formatQuote } from './src/core/services/quote.js';

async function testMultipleQuotes() {
  console.log("🧪 Testing multiple quote scenarios...\n");
  
  const testCases = [
    { network: 'base', amount: '100', from: 'USDC', to: 'WETH' },
    { network: 'base', amount: '0.001', from: 'WETH', to: 'USDC' },
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`📞 Getting quote for ${testCase.amount} ${testCase.from} → ${testCase.to} on ${testCase.network}...`);
      
      const quote = await getTokenSwapQuote({
        network: testCase.network,
        amount: testCase.amount,
        fromTokenSymbol: testCase.from,
        toTokenSymbol: testCase.to
      });
      
      const formatted = formatQuote(quote, {
        network: testCase.network,
        amount: testCase.amount,
        fromTokenSymbol: testCase.from,
        toTokenSymbol: testCase.to
      });
      
      console.log("✅ Quote received!\n");
      console.log(formatted);
      console.log("\n" + "=".repeat(80) + "\n");
      
    } catch (error) {
      console.error(`❌ Error for ${testCase.from}→${testCase.to}:`, error.message);
      console.log("\n" + "=".repeat(80) + "\n");
    }
  }
}

testMultipleQuotes().catch(console.error);
