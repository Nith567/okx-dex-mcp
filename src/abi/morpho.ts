export const MorphoPoolAbi = [
  {
      inputs: [{
          internalType: "address",
          name: "assets",
          type: "uint256",
      }, {
          internalType: "address",
          name: "receiver",
          type: "address",
      }],
      name: "deposit",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
  }
] as const 