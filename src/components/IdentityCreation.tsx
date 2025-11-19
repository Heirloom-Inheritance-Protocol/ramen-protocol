import { useState } from "react";
import { Identity } from "@semaphore-protocol/identity";
import { useWallets } from "@privy-io/react-auth";

export default function IdentityCreation() {
  const { wallets } = useWallets();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createIdentity = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Check if wallet is connected
      if (!wallets || wallets.length === 0) {
        throw new Error("No wallet connected");
      }

      const connectedWallet = wallets[0];

      // Ensure wallet is connected before attempting to sign
      if (connectedWallet.walletClientType === 'privy') {
        // For Privy embedded wallets, we need to use their signing method
        await connectedWallet.loginOrLink();
      }

      const walletAddress = connectedWallet.address;

      // Request user to sign a message to prove ownership
      const message = `Sign this message to create your Semaphore identity.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;

      // Use the wallet's native signing method via EIP-1193 provider
      const provider = await connectedWallet.getEthereumProvider();

      // Request signature using personal_sign
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      }) as string;

      // Verify we got a signature (proves ownership)
      if (!signature) {
        throw new Error("Signature verification failed");
      }

      // Create Semaphore identity using the signature as the secret
      const identity = new Identity(signature);
      const commitment = identity.commitment.toString();

      // Store identity data in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("semaphoreSignature", signature);
        localStorage.setItem("semaphoreWalletAddress", walletAddress);
        localStorage.setItem("semaphoreCommitment", commitment);
        
        // Dispatch custom event to notify parent components
        window.dispatchEvent(new Event("identityCreated"));
      }

      // Log success
      console.log("true");
      console.log("Identity created successfully:", {
        walletAddress,
        commitment,
      });

    } catch (err) {
      console.error("Error creating identity:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <button
        className="flex items-center justify-center py-2 px-4 rounded-md bg-blue-500 text-white font-semibold transition hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70"
        onClick={createIdentity}
        disabled={isCreating || !wallets || wallets.length === 0}
      >
        {isCreating ? "Revealing secrets..." : "Show my secrets"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: "8px" }}>
          Error: {error}
        </p>
      )}

      {!wallets || wallets.length === 0 && (
        <p style={{ color: "#6B7280", marginTop: "8px" }}>
          Please connect your wallet first
        </p>
      )}
    </div>
  );
}
