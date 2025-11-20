// ZkHeriloom3 contract address - Deployed on Scroll Sepolia
// Deployed at: 0xe46c683691ad993133cde2a0cc19ccae724fe93d
export const CONTRACT_ADDRESS = 
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) ||
  "0xe46c683691ad993133cde2a0cc19ccae724fe93d";

export const CONTRACT_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "inheritanceId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "successor",
        type: "address",
      },
    ],
    name: "InheritanceClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "inheritanceId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "successor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "ipfsHash",
        type: "string",
      },
      { indexed: false, internalType: "string", name: "tag", type: "string" },
      {
        indexed: false,
        internalType: "uint256",
        name: "parentInheritanceId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "generationLevel",
        type: "uint256",
      },
    ],
    name: "InheritanceCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "inheritanceId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "InheritanceDeleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "originalInheritanceId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "newInheritanceId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newSuccessor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "generationLevel",
        type: "uint256",
      },
    ],
    name: "InheritancePassedDown",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "inheritanceId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "InheritanceRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "inheritanceId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "oldSuccessor",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newSuccessor",
        type: "address",
      },
    ],
    name: "SuccessorUpdated",
    type: "event",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_inheritanceId", type: "uint256" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "canAccessInheritance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_inheritanceId", type: "uint256" },
    ],
    name: "claimInheritance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_successor", type: "address" },
      { internalType: "string", name: "_ipfsHash", type: "string" },
      { internalType: "string", name: "_tag", type: "string" },
      { internalType: "string", name: "_fileName", type: "string" },
      { internalType: "uint256", name: "_fileSize", type: "uint256" },
    ],
    name: "createInheritance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_inheritanceId", type: "uint256" },
    ],
    name: "deleteInheritance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_owner", type: "address" }],
    name: "getActiveInheritancesCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_inheritanceId", type: "uint256" },
    ],
    name: "getInheritance",
    outputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "successor", type: "address" },
      { internalType: "string", name: "ipfsHash", type: "string" },
      { internalType: "string", name: "tag", type: "string" },
      { internalType: "string", name: "fileName", type: "string" },
      { internalType: "uint256", name: "fileSize", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "bool", name: "isClaimed", type: "bool" },
      { internalType: "uint256", name: "parentInheritanceId", type: "uint256" },
      { internalType: "uint256", name: "generationLevel", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_inheritanceId", type: "uint256" },
    ],
    name: "getInheritanceChain",
    outputs: [{ internalType: "uint256[]", name: "chain", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_inheritanceId", type: "uint256" },
    ],
    name: "getInheritanceChildren",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_ipfsHash", type: "string" }],
    name: "getInheritancesByIpfsHash",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_owner", type: "address" }],
    name: "getOwnerInheritances",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_inheritanceId", type: "uint256" },
    ],
    name: "getRootInheritance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_successor", type: "address" }],
    name: "getSuccessorInheritances",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "inheritanceChildren",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "inheritanceCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "inheritances",
    outputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "successor", type: "address" },
      { internalType: "string", name: "ipfsHash", type: "string" },
      { internalType: "string", name: "tag", type: "string" },
      { internalType: "string", name: "fileName", type: "string" },
      { internalType: "uint256", name: "fileSize", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "bool", name: "isClaimed", type: "bool" },
      { internalType: "uint256", name: "parentInheritanceId", type: "uint256" },
      { internalType: "uint256", name: "generationLevel", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "", type: "string" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "ipfsHashToInheritances",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "ownerInheritances",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_inheritanceId", type: "uint256" },
      { internalType: "address", name: "_newSuccessor", type: "address" },
    ],
    name: "passDownInheritance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_inheritanceId", type: "uint256" },
    ],
    name: "revokeInheritance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "successorInheritances",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_inheritanceId", type: "uint256" },
      { internalType: "address", name: "_newSuccessor", type: "address" },
    ],
    name: "updateSuccessor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
