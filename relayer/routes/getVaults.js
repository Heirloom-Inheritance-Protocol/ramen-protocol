import express from 'express';
import { Contract, JsonRpcProvider } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { HERILOOM_CONTRACT_ADDRESS } from '../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Load contract ABI
const abiPath = join(__dirname, '../../out/zkheriloom3.sol/zkHeriloom3.json');
let HeriloomArtifact;
try {
  HeriloomArtifact = JSON.parse(readFileSync(abiPath, 'utf8'));
} catch (error) {
  console.error('❌ Error loading contract ABI:', error.message);
  console.error('   Make sure to compile contracts with: forge build');
}

router.get('/', async (req, res) => {
  try {
    // Validate that the ABI is loaded
    if (!HeriloomArtifact || !HeriloomArtifact.abi) {
      return res.status(500).json({
        error: 'Contract ABI not loaded',
        details: 'Run "forge build" to compile contracts'
      });
    }

    // Configure provider (no need for signer because it's a read-only call)
    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const contract = new Contract(
      HERILOOM_CONTRACT_ADDRESS,
      HeriloomArtifact.abi,
      provider
    );

    console.log('📋 Fetching vaults array...');
    console.log('   Contract:', HERILOOM_CONTRACT_ADDRESS);

    // Get the number of vaults
    const vaultIdsLength = await contract.vaultIds.length();
    console.log('   Total vaults:', vaultIdsLength.toString());

    // Get all vault IDs from the array
    const vaults = [];
    for (let i = 0; i < Number(vaultIdsLength); i++) {
      const vaultId = await contract.vaultIds(i);
      vaults.push({
        vaultId: vaultId.toString(),
        index: i
      });
    }

    console.log('✅ Vaults fetched successfully:', vaults);

    return res.status(200).json({
      success: true,
      totalVaults: Number(vaultIdsLength),
      vaults: vaults
    });

  } catch (error) {
    console.error('❌ Error in getVaults route:', error);

    // Handle specific ethers errors
    let errorMessage = error.message;
    if (error.code === 'CALL_EXCEPTION') {
      errorMessage = 'Smart contract call failed. Check contract address.';
    }

    return res.status(500).json({
      error: 'Query failed',
      message: errorMessage,
      code: error.code
    });
  }
});

export default router;

