import express from "express";
import {Contract, JsonRpcProvider} from "ethers";
import { SEMAPHORE_CONTRACT_ADDRESS } from "../config/constants.js";

const router = express.Router();

// Semaphore contract address from constants
const SEMAPHORE_ADDRESS = SEMAPHORE_CONTRACT_ADDRESS;

router.get("/:vaultId", async (req, res) => {
    try {
        const {vaultId} = req.params;
        const vaultIdNum = parseInt(vaultId);

        console.log(`🔵 Fetching members for vault ${vaultId} from Arkiv...`);

        // Use Arkiv as the single source of truth for members
        // Members are stored in chronological order when they join via /api/vault/add-member
        let members = [];
        try {
            const arkivApiUrl = process.env.ARKIV_API_URL || "http://localhost:3000/api/arkiv";
            const arkivResponse = await fetch(`${arkivApiUrl}?database=true`);

            if (arkivResponse.ok) {
                const arkivData = await arkivResponse.json();
                const allEntries = arkivData.database || [];

                // Filter vault member entries for this specific vaultId
                const vaultMembers = allEntries.filter(entry =>
                    entry.type === 'vault-member' && entry.vaultId === vaultIdNum
                );

                // Sort by timestamp to maintain chronological order
                members = vaultMembers
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                    .map(entry => entry.identityCommitment);

                console.log(`✅ Retrieved ${members.length} members from Arkiv for vault ${vaultId}`);
            } else {
                console.warn('⚠️  Arkiv query failed, members list may be empty');
            }
        } catch (arkivError) {
            console.error("❌ Error fetching members from Arkiv:", arkivError.message);
            // If Arkiv fails, return empty array - don't fail the entire request
            // Vault metadata (root, depth, size) will still be returned from blockchain
            members = [];
        }

        // Get vault (group) metadata from RPC (only metadata, not members - much faster)
        // Note: Vaults are Semaphore groups - they're the same thing
        const provider = new JsonRpcProvider(process.env.RPC_URL);
        const semaphoreABI = [
            {
                inputs: [{name: "groupId", type: "uint256"}],
                name: "getMerkleTreeRoot",
                outputs: [{name: "", type: "uint256"}],
                stateMutability: "view",
                type: "function",
            },
            {
                inputs: [{name: "groupId", type: "uint256"}],
                name: "getMerkleTreeDepth",
                outputs: [{name: "", type: "uint256"}],
                stateMutability: "view",
                type: "function",
            },
            {
                inputs: [{name: "groupId", type: "uint256"}],
                name: "getMerkleTreeSize",
                outputs: [{name: "", type: "uint256"}],
                stateMutability: "view",
                type: "function",
            },
        ];

        const semaphoreContract = new Contract(SEMAPHORE_ADDRESS, semaphoreABI, provider);

        // Fetch vault metadata in parallel
        const [merkleTreeRoot, merkleTreeDepth, merkleTreeSize] = await Promise.all([
            semaphoreContract.getMerkleTreeRoot(vaultIdNum),
            semaphoreContract.getMerkleTreeDepth(vaultIdNum),
            semaphoreContract.getMerkleTreeSize(vaultIdNum),
        ]);

        console.log(`✅ Fetched vault metadata for vault ${vaultId}`);
        console.log(`   Merkle Tree Root: ${merkleTreeRoot}`);
        console.log(`   Merkle Tree Depth: ${merkleTreeDepth}`);
        console.log(`   Merkle Tree Size: ${merkleTreeSize}`);

        return res.status(200).json({
            success: true,
            vaultId: vaultIdNum,
            members: members,
            memberCount: members.length,
            vaultMetadata: {
                merkleTreeRoot: merkleTreeRoot.toString(),
                merkleTreeDepth: Number(merkleTreeDepth),
                merkleTreeSize: Number(merkleTreeSize),
            },
        });
    } catch (error) {
        console.error("❌ Error in members route:", error);

        let errorMessage = error.message;
        if (error.code === "CALL_EXCEPTION") {
            errorMessage = "Smart contract call failed. Vault might not exist.";
        }

        return res.status(500).json({
            error: "Failed to fetch vault members",
            message: errorMessage,
            code: error.code,
        });
    }
});

export default router;
