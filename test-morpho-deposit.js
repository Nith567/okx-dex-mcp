// Test the Morpho deposit service (swapAndDepositMorpho)
import { swapAndDepositMorpho } from './src/core/services/deposit-morpho.js';

async function testMorphoDeposit() {
  console.log("🧪 Testing Morpho Deposit Service...\n");

  // Change these values as needed for your test
  const amount = '0.0007'; // Amount to deposit (in WETH or to swap)
  const fromTokenSymbol = 'WETH'; // Use 'USDC' or other token to test swap+deposit
  const userNetwork = 'base'; // Network to use

  try {
    console.log(`🔍 Attempting to deposit ${amount} ${fromTokenSymbol} into Morpho on ${userNetwork}...`);
    const result = await swapAndDepositMorpho({ amount, fromTokenSymbol, userNetwork });
    console.log("\nResult:\n", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message || error);
  }
}

testMorphoDeposit().catch(console.error);
