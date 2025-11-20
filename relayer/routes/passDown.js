import express from "express";
import {Contract, JsonRpcProvider, Wallet} from "ethers";
import {readFileSync} from "fs";
import {fileURLToPath} from "url";
import {dirname, join} from "path";
import { HERILOOM_CONTRACT_ADDRESS } from "../config/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Load contract ABI
const abiPath = join(__dirname, "../../out/zkheriloom3.sol/ZkHeriloom3.json");
let HeriloomArtifact;
try {
    HeriloomArtifact = JSON.parse(readFileSync(abiPath, "utf8"));
} catch (error) {
    console.error("❌ Error loading contract ABI:", error.message);
    console.error("   Make sure to compile contracts with: forge build");
}

router.post("/", async (req, res) => {
    console.log("🔵 ========== PASS DOWN INHERITANCE ROUTE CALLED ==========");

    try {
        // Validate that the ABI is loaded
        if (!HeriloomArtifact || !HeriloomArtifact.abi) {
            return res.status(500).json({
                error: "Contract ABI not loaded",
                details: 'Run "forge build" to compile contracts',
            });
        }

        // Extract parameters from request body
        const { inheritanceId, newSuccessorCommitment } = req.body;

        // Validate required parameters
        if (!inheritanceId || !newSuccessorCommitment) {
            return res.status(400).json({
                error: "Missing required parameters",
                details: "Required: inheritanceId, newSuccessorCommitment",
            });
        }

        console.log("📋 Pass down details:");
        console.log("   Inheritance ID:", inheritanceId);
        console.log("   New Successor Commitment:", newSuccessorCommitment);

        // Configure provider and signer (relayer pays gas)
        const provider = new JsonRpcProvider(process.env.RPC_URL);
        const signer = new Wallet(process.env.PRIVATE_KEY, provider);
        console.log("✅ Relayer configured");
        console.log("   Relayer address:", signer.address);

        // Verify relayer balance
        const balance = await provider.getBalance(signer.address);
        console.log("   Relayer balance:", balance.toString(), "wei");

        if (balance === 0n) {
            return res.status(500).json({
                error: "Insufficient funds",
                details: "Relayer wallet has no funds to pay for gas",
            });
        }

        // Create contract instance
        const heriloomContract = new Contract(
            HERILOOM_CONTRACT_ADDRESS,
            HeriloomArtifact.abi,
            signer
        );

        console.log("🔵 Passing down inheritance on blockchain...");

        // Call passDownInheritance function (relayer pays gas)
        const transaction = await heriloomContract.passDownInheritance(
            inheritanceId,
            newSuccessorCommitment
        );

        console.log("✅ Transaction sent successfully");
        console.log("   Transaction hash:", transaction.hash);

        const receipt = await transaction.wait();
        console.log("✅ Transaction confirmed!");
        console.log("   Block number:", receipt.blockNumber);

        // Parse events to get new inheritance ID
        const { Interface } = await import("ethers");
        const InheritancePassedDownEventAbi =
            "event InheritancePassedDown(uint256 indexed oldInheritanceId, uint256 indexed newInheritanceId, address indexed owner, uint256 newSuccessorCommitment)";

        const iface = new Interface([InheritancePassedDownEventAbi]);

        let newInheritanceId = null;

        // Parse all logs to find InheritancePassedDown event
        for (const log of receipt.logs) {
            if (log.address.toLowerCase() === HERILOOM_CONTRACT_ADDRESS.toLowerCase()) {
                try {
                    const parsed = iface.parseLog({
                        topics: log.topics,
                        data: log.data,
                    });

                    if (parsed && parsed.name === "InheritancePassedDown") {
                        newInheritanceId = parsed.args.newInheritanceId.toString();
                        console.log("✅ New inheritance created with ID:", newInheritanceId);
                    }
                } catch (parseError) {
                    // Not an InheritancePassedDown event, continue
                }
            }
        }

        if (!newInheritanceId) {
            console.warn("⚠️  InheritancePassedDown event not found");
        }

        return res.status(200).json({
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            oldInheritanceId: inheritanceId,
            newInheritanceId: newInheritanceId,
            message: "Inheritance passed down successfully (gasless transaction via relayer)"
        });

    } catch (error) {
        console.error("❌ ========== ERROR IN PASS DOWN ROUTE ==========");
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
