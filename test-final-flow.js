import { spawn } from 'child_process';

async function testCompleteFlow() {
  console.log("🧪 Testing complete gasless swap flow with transfer to EOA...\n");
  
  // Get initial WETH balance
  console.log("1️⃣ Getting initial WETH balance...");
  const initialBalance = await getWETHBalance();
  console.log(`Initial EOA WETH: ${initialBalance} WETH\n`);
  
  // Perform swap
  console.log("2️⃣ Performing USDC → WETH swap...");
  const swapResult = await performSwap();
  console.log(`Swap result: ${swapResult ? '✅ Success' : '❌ Failed'}\n`);
  
  if (!swapResult) {
    console.log("❌ Swap failed, stopping test");
    return;
  }
  
  console.log("3️⃣ Waiting for blockchain to update...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Get final WETH balance
  console.log("4️⃣ Getting final WETH balance...");
  const finalBalance = await getWETHBalance();
  console.log(`Final EOA WETH: ${finalBalance} WETH\n`);
  
  // Calculate difference
  const difference = parseFloat(finalBalance) - parseFloat(initialBalance);
  console.log(`📊 WETH received by EOA: ${difference.toFixed(18)} WETH`);
  
  if (difference > 0) {
    console.log("🎉 SUCCESS! EOA received WETH directly from the swap!");
  } else {
    console.log("❌ No WETH received by EOA");
  }
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    const proc = spawn('bun', command.split(' ').slice(1), {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let error = '';
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed: ${error}`));
      }
    });
  });
}

async function getWETHBalance() {
  try {
    const output = await runCommand('bun check-weth-balance-optimism.js');
    const match = output.match(/📊 EOA WETH Balance: ([\d.]+) WETH/);
    return match ? match[1] : '0';
  } catch (error) {
    console.error('Error getting WETH balance:', error);
    return '0';
  }
}

async function performSwap() {
  try {
    const output = await runCommand('bun test-swap.js');
    return output.includes('✅ Swap successful!');
  } catch (error) {
    console.error('Error performing swap:', error);
    return false;
  }
}

testCompleteFlow().catch(console.error);
