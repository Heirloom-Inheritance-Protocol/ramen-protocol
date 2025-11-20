import express from "express";
import {Contract, JsonRpcProvider, Wallet, Interface} from "ethers";
import {readFileSync} from "fs";
import {fileURLToPath} from "url";
import {dirname, join} from "path";
import {MongoClient} from "mongodb";
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
    console.log("🔵 ========== ADD MEMBER ROUTE CALLED ==========");
    console.log("🔵 Request body:", JSON.stringify(req.body, null, 2));

    try {
        const {identityCommitment, vaultId} = req.body;

        // Validate input
        if (!identityCommitment) {
            console.error("❌ Missing identityCommitment");
            return res.status(400).json({
                error: "Missing required parameter",
                details: "identityCommitment is required",
            });
        }

        if (!vaultId && vaultId !== 0) {
            console.error("❌ Missing vaultId");
            return res.status(400).json({
                error: "Missing required parameter",
                details: "vaultId is required",
            });
        }

        console.log("✅ Identity commitment received:", identityCommitment);
        console.log("✅ Vault ID received:", vaultId);

        // Validate that the ABI is loaded
        if (!HeriloomArtifact || !HeriloomArtifact.abi) {
            console.error("❌ Contract ABI not loaded");
            return res.status(500).json({
                error: "Contract ABI not loaded",
                details: 'Run "forge build" to compile contracts',
            });
        }
        console.log("✅ Contract ABI loaded");

        // Configure provider and signer
        console.log("🔵 Configuring provider and signer...");
        const provider = new JsonRpcProvider(process.env.RPC_URL);
        const signer = new Wallet(process.env.PRIVATE_KEY, provider);
        console.log("✅ Provider and signer configured");
        console.log("   Signer address:", signer.address);

        const contract = new Contract(HERILOOM_CONTRACT_ADDRESS, HeriloomArtifact.abi, signer);
        console.log("✅ Contract instance created");
        console.log("   Contract address:", HERILOOM_CONTRACT_ADDRESS);

        // Verify signer balance
        console.log("🔵 Checking relayer balance...");
        const balance = await provider.getBalance(signer.address);
        console.log("   Relayer balance:", balance.toString(), "wei");
        console.log("   Relayer balance (ETH):", (Number(balance) / 1e18).toFixed(6), "ETH");

        if (balance === 0n) {
            console.error("❌ Relayer has no funds");
            return res.status(500).json({
                error: "Insufficient funds",
                details: "Relayer wallet has no funds to pay for gas",
            });
        }

        // Verify the vault (group) exists in Semaphore
        // Note: Vaults are Semaphore groups - they're the same thing
        console.log("🔵 Verifying vault exists in Semaphore...");
        try {
            const semaphoreGroupsABI = [
                {
                    inputs: [{name: "groupId", type: "uint256"}],
                    name: "getMerkleTreeRoot",
                    outputs: [{name: "", type: "uint256"}],
                    stateMutability: "view",
                    type: "function",
                },
            ];
            const semaphoreContract = new Contract(SEMAPHORE_CONTRACT_ADDRESS, semaphoreGroupsABI, provider);

            console.log("   Checking if vault", vaultId, "exists in Semaphore...");
            const merkleRoot = await semaphoreContract.getMerkleTreeRoot(vaultId);
            console.log("✅ Vault exists in Semaphore!");
            console.log("   Merkle tree root:", merkleRoot.toString());
        } catch (semaphoreCheckError) {
            console.error("❌ Vault does NOT exist in Semaphore:");
            console.error("   Error:", semaphoreCheckError.message);
            return res.status(500).json({
                error: "Vault does not exist in Semaphore",
                details: `The vault ID ${vaultId} does not exist in Semaphore. Please verify the vault was created.`,
                vaultId: vaultId,
                contractAddress: HERILOOM_CONTRACT_ADDRESS,
            });
        }

        // Verify if the user is already a member
        console.log("🔵 Checking if user is already a member...");
        try {
            console.log("   Calling contract.isVaultMember(", vaultId, ",", identityCommitment, ")...");
            const isMember = await contract.isVaultMember(vaultId, identityCommitment);
            console.log("✅ Is already member:", isMember);

            if (isMember) {
                console.log("✅ User is already a member, returning success");
                return res.status(200).json({
                    success: true,
                    message: "Already a member",
                    details: "This identity commitment is already a member of the vault",
                    vaultId: vaultId,
                });
            }
        } catch (checkError) {
            console.warn("⚠️  Could not verify membership status:");
            console.warn("   Error:", checkError.message);
            console.warn("   Continuing anyway...");
        }

        // Execute transaction
        console.log("🔵 Executing transaction to add member...");
        console.log("   Calling contract.addMember(", vaultId, ",", identityCommitment, ")...");

        try {
            const transaction = await contract.addMember(vaultId, identityCommitment);
            console.log("✅ Transaction sent successfully");
            console.log("   Transaction hash:", transaction.hash);
            console.log("   Waiting for confirmation...");

            const receipt = await transaction.wait();
            console.log("✅ Transaction confirmed!");
            console.log("   Block number:", receipt.blockNumber);
            console.log("   Gas used:", receipt.gasUsed.toString());
            console.log("   Status:", receipt.status === 1 ? "Success" : "Failed");

            // Parse MemberAdded event from Semaphore
            const MemberAddedEventAbi = "event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)";
            const iface = new Interface([MemberAddedEventAbi]);
            
            let memberAddedEvent = null;
            let eventData = null;
            
            for (const log of receipt.logs) {
                if (log.address.toLowerCase() === SEMAPHORE_CONTRACT_ADDRESS.toLowerCase()) {
                    try {
                        const parsed = iface.parseLog({
                            topics: log.topics,
                            data: log.data
                        });
                        
                        if (parsed && parsed.name === "MemberAdded") {
                            memberAddedEvent = parsed;
                            eventData = {
                                index: parsed.args.index.toString(),
                                identityCommitment: parsed.args.identityCommitment.toString(),
                                merkleTreeRoot: parsed.args.merkleTreeRoot.toString()
                            };
                            console.log("✅ Found MemberAdded event:");
                            console.log("   Index:", eventData.index);
                            console.log("   Identity Commitment:", eventData.identityCommitment);
                            console.log("   Merkle Tree Root:", eventData.merkleTreeRoot);
                            break;
                        }
                    } catch (parseError) {
                        continue;
                    }
                }
            }
            
            if (memberAddedEvent && eventData) {
                // Store in MongoDB
                let mongoClient;
                try {
                    console.log("🔵 Connecting to MongoDB...");
                    const clientOptions = {
                        connectTimeoutMS: 30000,
                        serverSelectionTimeoutMS: 30000,
                        retryWrites: true,
                        retryReads: true,
                    };
                    
                    mongoClient = new MongoClient(process.env.MONGODB_URI, clientOptions);
                    await mongoClient.connect();
                    console.log("✅ MongoDB client connected");

                    const database = mongoClient.db("HERILOOM");
                    const collection = database.collection("Commitments");

                    const document = {
                        vaultId: Number(vaultId),
                        identityCommitment: identityCommitment, 
                        transactionHash: receipt.hash,
                        blockNumber: receipt.blockNumber,
                        merkleTreeData: {
                            index: eventData.index, 
                            identityCommitment: eventData.identityCommitment,   
                            merkleTreeRoot: eventData.merkleTreeRoot 
                        },
                        timestamp: new Date(),
                    };

                    console.log("🔵 Inserting document into MongoDB...");
                    const result = await collection.insertOne(document);
                    console.log("✅ Document inserted with _id:", result.insertedId);

                } catch (mongoError) {
                    console.error("❌ MongoDB error:", mongoError.message);
                } finally {
                    if (mongoClient) {
                        try {
                            await mongoClient.close();
                            console.log("✅ MongoDB connection closed");
                        } catch (closeError) {
                            console.warn("⚠️  Error closing MongoDB connection:", closeError.message);
                        }
                    }
                }
            } else {
                console.warn("⚠️  MemberAdded event not found in transaction logs");
            }

            return res.status(200).json({
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                vaultId: vaultId,
            });
        } catch (txError) {
            console.error("❌ Transaction failed:");
            console.error("   Error message:", txError.message);
            console.error("   Error code:", txError.code);
            throw txError;
        }
    } catch (error) {
        console.error("❌ ========== ERROR IN ADD MEMBER ROUTE ==========");
        console.error("❌ Error type:", error.constructor.name);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error code:", error.code);

        let errorMessage = error.message;
        let errorDetails = null;

        if (error.code === "INSUFFICIENT_FUNDS") {
            errorMessage = "Relayer wallet has insufficient funds for gas";
            errorDetails = `Relayer address: ${error.transaction?.from || "unknown"}`;
        } else if (error.code === "CALL_EXCEPTION" || error.code === "ACTION_REJECTED") {
            errorMessage = "Smart contract call failed";
            errorDetails = error.message;
        } else if (error.message?.includes("network") || error.message?.includes("timeout")) {
            errorMessage = "Network error";
            errorDetails = "Failed to connect to the blockchain. Check your RPC_URL and network connection.";
        }

        return res.status(500).json({
            error: "Transaction failed",
            message: errorMessage,
            details: errorDetails,
            code: error.code,
        });
    }
});

export default router;

