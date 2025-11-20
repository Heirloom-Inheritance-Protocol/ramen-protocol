import {Contract, JsonRpcProvider, Wallet} from "ethers";
import {readFileSync} from "fs";
import {fileURLToPath} from "url";
import {dirname, join} from "path";
import { HERILOOM_CONTRACT_ADDRESS } from "../config/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load contract ABI once - using compiled contract from out directory
const abiPath = join(__dirname, "../../out/zkheriloom3.sol/zkHeriloom3.json");
let HeriloomArtifact;
try {
    HeriloomArtifact = JSON.parse(readFileSync(abiPath, "utf8"));
} catch (error) {
    console.error("❌ Error loading contract ABI:", error.message);
    console.error("   Make sure to compile contracts with: forge build");
    console.error("   Expected path: out/zkheriloom3.sol/zkHeriloom3.json");
}

export function validateABI(res) {
    if (!HeriloomArtifact || !HeriloomArtifact.abi) {
        res.status(500).json({
            error: "Contract ABI not loaded",
            details: 'Run "forge build" to compile contracts',
        });
        return false;
    }
    return true;
}

export function getContract() {
    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const signer = new Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new Contract(HERILOOM_CONTRACT_ADDRESS, HeriloomArtifact.abi, signer);
    return {provider, signer, contract};
}

export async function checkBalance(provider, signer, res) {
    const balance = await provider.getBalance(signer.address);
    console.log("   Relayer balance:", balance.toString());

    if (balance === 0n) {
        res.status(500).json({
            error: "Insufficient funds",
            details: "Relayer wallet has no funds to pay for gas",
        });
        return false;
    }
    return true;
}

export function handleError(error, res) {
    console.error(" Error:", error);

    return res.status(500).json({
        error: error.message,
    });
}
