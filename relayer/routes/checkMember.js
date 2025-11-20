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
const abiPath = join(__dirname, '../../out/zkheriloom3.sol/ZkHeriloom3.json');
let HeriloomArtifact;
try {
  HeriloomArtifact = JSON.parse(readFileSync(abiPath, 'utf8'));
} catch (error) {
  console.error('❌ Error loading contract ABI:', error.message);
  console.error('   Make sure to compile contracts with: forge build');
}

router.get('/', async (req, res) => {
  try {
    const { identityCommitment, vaultId } = req.query;

    // Validate input
    if (!identityCommitment) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: 'identityCommitment is required'
      });
    }

    if (!vaultId && vaultId !== '0') {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: 'vaultId is required'
      });
    }

    // Check Arkiv database first
    try {
      console.log('🔵 Checking Arkiv for vault member...');
      const arkivApiUrl = process.env.ARKIV_API_URL || "http://localhost:3000/api/arkiv";
      const arkivResponse = await fetch(`${arkivApiUrl}?database=true`);

      if (arkivResponse.ok) {
        const arkivData = await arkivResponse.json();
        const members = arkivData.database || [];

        // Find member with matching vaultId and identityCommitment
        const member = members.find(entry =>
          entry.type === 'vault-member' &&
          entry.vaultId === parseInt(vaultId) &&
          entry.identityCommitment === identityCommitment.toString()
        );

        if (member) {
          console.log('✅ Member found in Arkiv');
          return res.status(200).json({
            success: true,
            isMember: true,
            vaultId: vaultId,
            identityCommitment: identityCommitment,
            source: 'arkiv',
            transactionHash: member.transactionHash || null
          });
        } else {
          console.log('⚠️  Member not found in Arkiv, checking blockchain...');
        }
      } else {
        console.warn('⚠️  Arkiv query failed, falling back to blockchain...');
      }
    } catch (arkivError) {
      console.error('❌ Arkiv error:', arkivError.message);
      console.log('⚠️ Falling back to blockchain verification...');
    }

    // Fall back to blockchain check
    if (!HeriloomArtifact || !HeriloomArtifact.abi) {
      return res.status(500).json({
        error: 'Arkiv unavailable and contract ABI not loaded',
        details: 'Cannot verify membership'
      });
    }

    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const contract = new Contract(
      HERILOOM_CONTRACT_ADDRESS,
      HeriloomArtifact.abi,
      provider
    );

    const isMember = await contract.isVaultMember(vaultId, identityCommitment);

    return res.status(200).json({
      success: true,
      isMember: isMember,
      vaultId: vaultId,
      identityCommitment: identityCommitment,
      source: 'blockchain',
      warning: 'Arkiv unavailable, using blockchain as source'
    });

  } catch (error) {
    console.error('❌ Error in checkMember route:', error);

    // Handle specific ethers errors
    let errorMessage = error.message;
    if (error.code === 'CALL_EXCEPTION') {
      errorMessage = 'Smart contract call failed. Check if group exists.';
    }

    return res.status(500).json({
      error: 'Query failed',
      message: errorMessage,
      code: error.code
    });
  }
});

export default router;
