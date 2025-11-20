import express from "express";
import {Contract, JsonRpcProvider} from "ethers";
import {getIdentityCommitmentsByGroup} from "../utils/mongodb.js";
import { SEMAPHORE_CONTRACT_ADDRESS } from "../config/constants.js";

const router = express.Router();

// Semaphore contract address from constants
const SEMAPHORE_ADDRESS = SEMAPHORE_CONTRACT_ADDRESS;

router.get("/:vaultId", async (req, res) => {
    try {
        const {vaultId} = req.params;
        const vaultIdNum = parseInt(vaultId);

        console.log(`🔵 Fetching members for vault ${vaultId} from database...`);

        // Use MongoDB as the single source of truth for members
        // Members are stored in chronological order when they join via /api/vault/add-member
        let members = [];
        try {
            members = await getIdentityCommitmentsByGroup(vaultIdNum);
            console.log(`✅ Retrieved ${members.length} members from database for vault ${vaultId}`);
        } catch (dbError) {
            console.error("❌ Error fetching members from database:", dbError.message);
            // If database fails, return empty array - don't fail the entire request
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
        const root = await semaphoreContract.getMerkleTreeRoot(vaultId);
        const depth = await semaphoreContract.getMerkleTreeDepth(vaultId);
        const size = await semaphoreContract.getMerkleTreeSize(vaultId);

        console.log(`✅ Vault data fetched successfully`);
        console.log(`   Root: ${root.toString()}`);
        console.log(`   Depth: ${depth.toString()}`);
        console.log(`   Size: ${size.toString()}`);
        console.log(`   Members: ${members.length}`);

        return res.status(200).json({
            vaultId: parseInt(vaultId),
            root: root.toString(),
            depth: depth.toString(),
            size: size.toString(),
            members: members.map((m) => m.toString()),
        });
    } catch (error) {
        console.error("❌ Error fetching members:", error);

        return res.status(500).json({
            error: "Failed to fetch members",
            message: error.message,
        });
    }
});

export default router;
