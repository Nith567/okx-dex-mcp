import { getPrivateKeyAsHex } from './src/core/config.js';
import { getWalletClient, getPublicClient } from './src/core/services/clients.js';
import { getOKXSupportedTokens } from './src/core/services/supported-tokens.js';
import { resolveChainId } from './src/core/chains.js';
import { formatEther } from 'viem';

async function checkBalances() {
  try {
    const network = 'base';
    const chainId = resolveChainId(network);
    
    // Get wallet
    const privateKey = getPrivateKeyAsHex();
    const walletClient = getWalletClient(privateKey, network);
    const publicClient = getPublicClient(network);
    const userAddress = walletClient.account.address;
    
    console.log(`Checking balances for: ${userAddress}`);
    console.log(`Network: ${network} (Chain ID: ${chainId})`);
    
    // Check ETH balance (for gas)
    const ethBalance = await publicClient.getBalance({ address: userAddress });
    console.log(`\n💰 ETH Balance: ${formatEther(ethBalance)} ETH`);
    
    if (ethBalance === 0n) {
      console.log('❌ No ETH for gas fees! You need some ETH on Optimism to pay for transactions.');
      return;
    }
    
    // Check USDC balance
    const tokens = await getOKXSupportedTokens(chainId);
    const usdcToken = tokens.find(t => t.symbol.toUpperCase() === 'USDC');
    
    if (usdcToken) {
      const usdcBalance = await publicClient.readContract({
        address: usdcToken.contractAddress,
        abi: [{
          "inputs": [{"name": "account", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'balanceOf',
        args: [userAddress]
      });
      
      const formattedUsdcBalance = Number(usdcBalance) / Math.pow(10, usdcToken.decimals);
      console.log(`💵 USDC Balance: ${formattedUsdcBalance} USDC`);
      
      if (formattedUsdcBalance >= 0.1) {
        console.log('✅ Sufficient USDC for the swap!');
      } else {
        console.log('❌ Insufficient USDC balance for 0.1 USDC swap.');
      }
    }
    
    // Show what's needed
    console.log('\n📋 Requirements for swap:');
    console.log('1. ETH balance > 0 (for gas fees) ✅');
    console.log('2. USDC balance >= 0.1 (for swap amount) ❓');
    console.log('\n💡 If you have insufficient funds, you need to:');
    console.log('- Bridge some ETH to Optimism for gas fees');
    console.log('- Bridge or acquire USDC on Optimism for the swap');

  } catch (error) {
    console.error('❌ Balance check failed:', error.message);
  }
}

checkBalances();
