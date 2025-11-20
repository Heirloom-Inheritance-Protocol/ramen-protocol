import express from "express";
import {Contract, JsonRpcProvider, Wallet} from "ethers";
import {readFileSync} from "fs";
import {fileURLToPath} from "url";
import {dirname, join} from "path";
import { SEMAPHORE_CONTRACT_ADDRESS, HERILOOM_CONTRACT_ADDRESS } from "../config/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Load contract ABI
const abiPath = join(__dirname, "../../out/zkheriloom3.sol/zkHeriloom3.json");
let HeriloomArtifact;
try {
    HeriloomArtifact = JSON.parse(readFileSync(abiPath, "utf8"));
} catch (error) {
    console.error("❌ Error loading contract ABI:", error.message);
    console.error("   Make sure to compile contracts with: forge build");
}

router.post("/", async (req, res) => {
    console.log("🔵 ========== CREATE VAULT ROUTE CALLED ==========");

    try {
        // Validate that the ABI is loaded
        if (!HeriloomArtifact || !HeriloomArtifact.abi) {
            return res.status(500).json({
                error: "Contract ABI not loaded",
                details: 'Run "forge build" to compile contracts',
            });
        }

        // Configure provider and signer
        const provider = new JsonRpcProvider(process.env.RPC_URL);
        const signer = new Wallet(process.env.PRIVATE_KEY, provider);
        console.log("✅ Provider and signer configured");
        console.log("   Signer address:", signer.address);

        // Verify signer balance
        const balance = await provider.getBalance(signer.address);
        console.log("   Relayer balance:", balance.toString(), "wei");

        if (balance === 0n) {
            return res.status(500).json({
                error: "Insufficient funds",
                details: "Relayer wallet has no funds to pay for gas",
            });
        }

        // Note: Vaults are Semaphore groups - they're the same thing
        // Vaults are typically created automatically when creating an inheritance
        // This route creates a vault (group) directly via Semaphore if needed
        // For most use cases, vaults are created through createInheritance
        
        // Use Semaphore contract directly to create a group (vault = group)
        const semaphoreABI = [
            {
                inputs: [],
                name: "createGroup",
                outputs: [{name: "", type: "uint256"}],
                stateMutability: "nonpayable",
                type: "function",
            },
        ];

        const semaphoreContract = new Contract(SEMAPHORE_CONTRACT_ADDRESS, semaphoreABI, signer);
        
        console.log("🔵 Creating vault in Semaphore...");
        const transaction = await semaphoreContract.createGroup();
        console.log("✅ Transaction sent successfully");
        console.log("   Transaction hash:", transaction.hash);

        const receipt = await transaction.wait();
        console.log("✅ Transaction confirmed!");
        console.log("   Block number:", receipt.blockNumber);

        // Parse GroupCreated event to get the vault ID
        const { Interface } = await import("ethers");
        const GroupCreatedEventAbi = "event GroupCreated(uint256 indexed groupId, address indexed admin)";
        const iface = new Interface([GroupCreatedEventAbi]);
        
        let vaultId = null;
        for (const log of receipt.logs) {
            if (log.address.toLowerCase() === SEMAPHORE_CONTRACT_ADDRESS.toLowerCase()) {
                try {
                    const parsed = iface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });
                    
                    if (parsed && parsed.name === "GroupCreated") {
                        vaultId = parsed.args.groupId.toString();
                        console.log("✅ Vault created with ID:", vaultId);
                        break;
                    }
                } catch (parseError) {
                    continue;
                }
            }
        }

        if (!vaultId) {
            console.warn("⚠️  GroupCreated event not found, vault ID unknown");
        }

        return res.status(200).json({
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            vaultId: vaultId,
            message: "Vault created successfully. Note: Vaults are typically created automatically when creating an inheritance."
        });

    } catch (error) {
        console.error("❌ ========== ERROR IN CREATE VAULT ROUTE ==========");
        console.error("❌ Error message:", error.message);
        console.error("❌ Error code:", error.code);

        return res.status(500).json({
            error: "Transaction failed",
            message: error.message,
            code: error.code,
        });
    }
});

export default router;

