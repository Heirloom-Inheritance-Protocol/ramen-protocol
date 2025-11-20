import { decodeEventLog } from "viem";
import { scrollSepolia } from "viem/chains";
import { getWalletClient, publicClient } from "../viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contract";
import { addMemberToVault } from "../../services/relayerAPI";
import { Identity } from "@semaphore-protocol/identity";

interface CreateInheritanceParams {
  successorCommitment: bigint;
  ipfsHash: string;
  tag: string;
  fileName: string;
  fileSize: bigint;
}

export interface InheritanceData {
  id: bigint;
  owner: string;
  successorCommitment: bigint;
  ipfsHash: string;
  tag: string;
  fileName: string;
  fileSize: bigint;
  timestamp: bigint;
  isActive: boolean;
  isClaimed: boolean;
}

/**
 * Creates a new inheritance on the blockchain
 * @returns The inheritance ID
 */
export async function createInheritance({
  successorCommitment,
  ipfsHash,
  tag,
  fileName,
  fileSize,
}: CreateInheritanceParams): Promise<bigint> {
  const { walletClient, address } = await getWalletClient();

  // Check if wallet is on the correct chain
  const chainId = await walletClient.getChainId();
  if (chainId !== scrollSepolia.id) {
    try {
      // Request chain switch
      await walletClient.switchChain({ id: scrollSepolia.id });
    } catch {
      throw new Error(
        `Please switch your wallet to Scroll Sepolia network. Current chain: ${chainId}, Required: ${scrollSepolia.id}`,
      );
    }
  }

  // Simulate the transaction to check for errors
  const { request } = await publicClient.simulateContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "createInheritance",
    args: [successorCommitment, ipfsHash, tag, fileName, fileSize],
    account: address,
  });

  // Execute the transaction
  const hash = await walletClient.writeContract(request);

  // Wait for the transaction to be mined
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Parse the logs to get the inheritance ID from the InheritanceCreated event
  const log = receipt.logs.find((log) => {
    try {
      const decoded = decodeEventLog({
        abi: CONTRACT_ABI,
        data: log.data,
        topics: log.topics,
      });
      return decoded.eventName === "InheritanceCreated";
    } catch {
      return false;
    }
  });

  if (!log) {
    throw new Error("InheritanceCreated event not found in transaction logs");
  }

  const decoded = decodeEventLog({
    abi: CONTRACT_ABI,
    data: log.data,
    topics: log.topics,
  });

  const args = decoded.args as unknown as { inheritanceId: bigint };
  const inheritanceId = args.inheritanceId;

  // Note: Vault creation and member addition now happens during IPFS upload
  // The successor is added to the vault before creating the inheritance
  // This enables zero-knowledge proofs for the inheritance vault

  return inheritanceId;
}

/**
 * Gets the vault ID for a user address
 * @param userAddress The user's wallet address
 * @returns The vault ID or null if not found
 */
export async function getVaultIdForUser(
  userAddress: `0x${string}`,
): Promise<bigint | null> {
  try {
    const userData = (await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "userDatabase",
      args: [userAddress],
    })) as [bigint, bigint, bigint, bigint];

    const vaultId = userData[0]; // vaultID is the first element
    return vaultId !== BigInt(0) ? vaultId : null;
  } catch (error) {
    console.error("Error getting vault ID:", error);
    return null;
  }
}

/**
 * Generates a commitment hash from a wallet address
 * Creates a deterministic Semaphore identity from the wallet address
 * @param walletAddress - The wallet address to generate commitment from
 * @returns The commitment hash as a string
 */
export function generateCommitmentFromWallet(walletAddress: string): string {
  // Create a deterministic identity from the wallet address
  // This allows the successor to recreate their identity later by signing with their wallet
  const identity = new Identity(walletAddress);
  return identity.commitment.toString();
}

/**
 * Gets identity commitment from localStorage
 * @returns The identity commitment string or null
 */
function getIdentityCommitmentFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    const identityData = localStorage.getItem("semaphoreIdentity");
    if (!identityData) return null;
    
    const identity = JSON.parse(identityData);
    return identity.commitment || null;
  } catch (error) {
    console.error("Error reading identity from storage:", error);
    return null;
  }
}

/**
 * Adds a member to a vault using the relayer
 * @param userAddress The user's wallet address to get their vault
 * @param identityCommitment The identity commitment to add (optional, will try to get from storage)
 * @returns Promise that resolves when member is added
 */
export async function addMemberToUserVault(
  userAddress: `0x${string}`,
  identityCommitment?: string,
): Promise<void> {
  const vaultId = await getVaultIdForUser(userAddress);
  if (!vaultId || vaultId === BigInt(0)) {
    throw new Error("No vault found for user. Create an inheritance first.");
  }

  const commitment = identityCommitment || getIdentityCommitmentFromStorage();
  if (!commitment) {
    throw new Error("No identity commitment found. Please create a Semaphore identity first.");
  }

  await addMemberToVault(commitment, Number(vaultId));
}

/**
 * Deletes an inheritance from the blockchain
 * @param inheritanceId The ID of the inheritance to delete
 * @returns The transaction hash
 */
export async function deleteInheritance(
  inheritanceId: bigint,
): Promise<`0x${string}`> {
  const { walletClient, address } = await getWalletClient();

  // Check if wallet is on the correct chain
  const chainId = await walletClient.getChainId();
  if (chainId !== scrollSepolia.id) {
    try {
      // Request chain switch
      await walletClient.switchChain({ id: scrollSepolia.id });
    } catch {
      throw new Error(
        `Please switch your wallet to Scroll Sepolia network. Current chain: ${chainId}, Required: ${scrollSepolia.id}`,
      );
    }
  }

  // Simulate the transaction to check for errors
  const { request } = await publicClient.simulateContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "deleteInheritance",
    args: [inheritanceId],
    account: address,
  });

  // Execute the transaction
  const hash = await walletClient.writeContract(request);

  // Wait for the transaction to be mined
  await publicClient.waitForTransactionReceipt({ hash });

  return hash;
}

/**
 * Fetches all inheritances owned by a specific address
 * @param ownerAddress The address of the owner
 * @returns Array of inheritance data, filtered to exclude deleted ones
 */
export async function getOwnerInheritances(
  ownerAddress: `0x${string}`,
): Promise<InheritanceData[]> {
  console.log("🔍 getOwnerInheritances called with address:", ownerAddress);
  console.log("🔍 Contract address:", CONTRACT_ADDRESS);

  // Get array of inheritance IDs for the owner
  const inheritanceIds = (await publicClient.readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "getOwnerInheritances",
    args: [ownerAddress],
  })) as bigint[];

  console.log("🔍 Found", inheritanceIds.length, "inheritance IDs:", inheritanceIds);

  // Fetch details for each inheritance
  const inheritancePromises = inheritanceIds.map(async (id) => {
    const data = (await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "getInheritance",
      args: [id],
    })) as [string, bigint, string, string, string, bigint, bigint, boolean, boolean, bigint, bigint];

    return {
      id,
      owner: data[0],
      successorCommitment: data[1],
      ipfsHash: data[2],
      tag: data[3],
      fileName: data[4],
      fileSize: data[5],
      timestamp: data[6],
      isActive: data[7],
      isClaimed: data[8],
    };
  });

  const allInheritances = await Promise.all(inheritancePromises);

  // Filter out deleted inheritances (ipfsHash === "0")
  return allInheritances.filter(
    (inheritance) => inheritance.ipfsHash !== "0" && inheritance.ipfsHash !== "",
  );
}

/**
 * Fetches all inheritances where the commitment is the successor (beneficiary)
 * @param successorCommitment The Semaphore commitment hash of the successor
 * @returns Array of inheritance data, filtered to exclude deleted ones
 */
export async function getSuccessorInheritances(
  successorCommitment: string | bigint,
): Promise<InheritanceData[]> {
  // Get array of inheritance IDs where the commitment is the successor
  const inheritanceIds = (await publicClient.readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "getSuccessorInheritances",
    args: [BigInt(successorCommitment)],
  })) as bigint[];

  // Fetch details for each inheritance
  const inheritancePromises = inheritanceIds.map(async (id) => {
    const data = (await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "getInheritance",
      args: [id],
    })) as [string, bigint, string, string, string, bigint, bigint, boolean, boolean, bigint, bigint];

    return {
      id,
      owner: data[0],
      successorCommitment: data[1],
      ipfsHash: data[2],
      tag: data[3],
      fileName: data[4],
      fileSize: data[5],
      timestamp: data[6],
      isActive: data[7],
      isClaimed: data[8],
    };
  });

  const allInheritances = await Promise.all(inheritancePromises);

  // Filter out deleted inheritances (ipfsHash === "0")
  return allInheritances.filter(
    (inheritance) => inheritance.ipfsHash !== "0" && inheritance.ipfsHash !== "",
  );
}

/**
 * Reinherits an existing inheritance to a new successor
 * @param inheritanceId The ID of the inheritance to reinherit
 * @param newSuccessorCommitment The Semaphore commitment hash of the new successor
 * @returns The new inheritance ID
 */
export async function reinherit(
  inheritanceId: bigint,
  newSuccessorCommitment: bigint,
): Promise<bigint> {
  const { walletClient, address } = await getWalletClient();

  // Check if wallet is on the correct chain
  const chainId = await walletClient.getChainId();
  if (chainId !== scrollSepolia.id) {
    try {
      // Request chain switch
      await walletClient.switchChain({ id: scrollSepolia.id });
    } catch {
      throw new Error(
        `Please switch your wallet to Scroll Sepolia network. Current chain: ${chainId}, Required: ${scrollSepolia.id}`,
      );
    }
  }

  // Verify inheritance exists and get its details for debugging
  try {
    const inheritance = (await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "getInheritance",
      args: [inheritanceId],
    })) as [string, bigint, string, string, string, bigint, bigint, boolean, boolean, bigint, bigint];

    const [owner, successorCommitment, , , , , , isActive] = inheritance;
    console.log("Inheritance details:", {
      id: inheritanceId.toString(),
      owner,
      successorCommitment: successorCommitment.toString(),
      isActive,
      userAddress: address,
      isOwner: owner.toLowerCase() === address?.toLowerCase(),
    });

    if (!isActive) {
      throw new Error("Inheritance is not active");
    }

    if (owner.toLowerCase() !== address?.toLowerCase()) {
      throw new Error(
        `Only the owner can pass down this inheritance. Owner: ${owner}, Your address: ${address}`,
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Only the owner")) {
      throw error;
    }
    console.error("Error checking inheritance:", error);
    // Continue anyway - let the contract revert with its own error message
  }

  // Simulate the transaction to check for errors
  const { request } = await publicClient.simulateContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "passDownInheritance",
    args: [inheritanceId, newSuccessorCommitment],
    account: address,
  });

  // Execute the transaction
  const hash = await walletClient.writeContract(request);

  // Wait for the transaction to be mined
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Parse the logs to get the new inheritance ID from the InheritancePassedDown event
  const log = receipt.logs.find((log) => {
    try {
      const decoded = decodeEventLog({
        abi: CONTRACT_ABI,
        data: log.data,
        topics: log.topics,
      });
      return decoded.eventName === "InheritancePassedDown";
    } catch {
      return false;
    }
  });

  if (!log) {
    throw new Error("InheritancePassedDown event not found in transaction logs");
  }

  const decoded = decodeEventLog({
    abi: CONTRACT_ABI,
    data: log.data,
    topics: log.topics,
  });

  const args = decoded.args as unknown as { newInheritanceId: bigint };
  return args.newInheritanceId;
}
