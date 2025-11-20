const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:3001';

/**
 * Add a member to a vault via the relayer
 * Note: Vaults are Semaphore groups - they're the same thing
 * @param {string|BigInt} identityCommitment - The identity commitment to add to the vault
 * @param {number} vaultId - The vault ID (required)
 * @returns {Promise<{success: boolean, transactionHash: string, blockNumber: number, vaultId: number}>}
 */
export async function addMemberToVault(identityCommitment, vaultId) {
  if (!vaultId && vaultId !== 0) {
    throw new Error('vaultId is required');
  }

  if (!identityCommitment) {
    throw new Error('identityCommitment is required');
  }

  try {
    const response = await fetch(`${RELAYER_URL}/api/vault/add-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        identityCommitment: identityCommitment.toString(), 
        vaultId: Number(vaultId) 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || error.details || 'Failed to add member to vault');
    }

    const result = await response.json();
    console.log('✅ Member added to vault:', result.transactionHash);

    return result;
  } catch (error) {
    console.error('❌ Error adding member to vault:', error);
    throw error;
  }
}

/**
 * Check if the relayer is online and healthy
 * @returns {Promise<{status: string, message: string, contract: string, network: string}>}
 */
export async function checkRelayerHealth() {
  try {
    const response = await fetch(`${RELAYER_URL}/health`);

    if (!response.ok) {
      throw new Error('Relayer health check failed');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Relayer health check failed:', error);
    throw new Error('Relayer server is not available. Make sure it is running.');
  }
}
