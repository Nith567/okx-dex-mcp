// Test the quote functionality
import { getTokenSwapQuote, formatQuote } from './src/core/services/quote.js';

async function testQuote() {
  console.log("🧪 Testing OKX token swap quote...\n");
  
  try {
    console.log("📞 Getting quote for 0.01 WETH → USDC on Base...");
    
    const quote = await getTokenSwapQuote({
      network: 'base',
      amount: '0.01',
      fromTokenSymbol: 'WETH',
      toTokenSymbol: 'USDC'
    });
    
    const formatted = formatQuote(quote, {
      network: 'base',
      amount: '0.01',
      fromTokenSymbol: 'WETH',
      toTokenSymbol: 'USDC'
    });
    
    console.log("✅ Quote received!\n");
    console.log(formatted);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testQuote().catch(console.error);
