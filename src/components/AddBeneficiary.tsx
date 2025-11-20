import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { isAddress } from "viem";
import { cn } from "@/lib/utils";
import { reinherit } from "@/lib/services/heriloomProtocol";
import { addMemberToVault } from "@/services/relayerAPI";
import { Identity } from "@semaphore-protocol/identity";

interface AddBeneficiaryProps {
  onBeneficiaryAdded?: (address: string) => void;
  className?: string;
  inheritanceId?: bigint | null;
  vaultId?: number | null;
  mode?: "add" | "reinherit";
  disabled?: boolean;
  showCondition?: boolean;
}

export default function AddBeneficiaryButton({
  onBeneficiaryAdded,
  className,
  inheritanceId = null,
  vaultId = null,
  mode = "add",
  disabled = false,
  showCondition = true,
}: AddBeneficiaryProps) {
  const { user } = usePrivy();
  const [showForm, setShowForm] = useState(false);
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentWalletAddress = user?.wallet?.address?.toLowerCase();
  const isSameAsCurrentWallet =
    currentWalletAddress &&
    beneficiaryAddress.toLowerCase() === currentWalletAddress;

  const isValidAddress =
    beneficiaryAddress.trim() !== "" && isAddress(beneficiaryAddress);
  const isFormValid = isValidAddress && !isSameAsCurrentWallet;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate address format
      if (!isAddress(beneficiaryAddress)) {
        throw new Error("Invalid Ethereum address format");
      }

      // Check if address is the same as current wallet
      if (isSameAsCurrentWallet) {
        throw new Error("Cannot set your own wallet address as beneficiary");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trimmedAddress = beneficiaryAddress.trim() as any;

      // Handle reinherit mode
      if (
        mode === "reinherit" &&
        inheritanceId !== null &&
        inheritanceId !== undefined
      ) {
        const newInheritanceId = await reinherit(inheritanceId, trimmedAddress);

        // Call the callback if provided
        if (onBeneficiaryAdded) {
          await onBeneficiaryAdded(beneficiaryAddress);
        }

        alert(
          `Inheritance successfully passed down! New inheritance ID: ${newInheritanceId.toString()}`,
        );
      } else {
        // Handle add mode - add member to vault via relayer
        if (vaultId === null || vaultId === undefined) {
          throw new Error("Vault ID is required to add a member");
        }

        // Generate identity commitment for the beneficiary
        // In a real app, the beneficiary would generate this themselves
        // For now, we create a deterministic identity from their address
        const identity = new Identity(trimmedAddress);
        const identityCommitment = identity.commitment;

        // Add member to vault via relayer
        const result = await addMemberToVault(identityCommitment, vaultId);

        console.log("✅ Member added to vault:", result);

        // Call the callback if provided
        if (onBeneficiaryAdded) {
          await onBeneficiaryAdded(beneficiaryAddress);
        }

        alert(
          `Beneficiary successfully added to vault! Transaction: ${result.transactionHash}`,
        );
      }

      // Reset form
      setBeneficiaryAddress("");
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add beneficiary",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setBeneficiaryAddress("");
    setError(null);
    setShowForm(false);
  };

  // Conditional rendering pattern similar to received-inheritances.tsx
  if (!showCondition) return null;

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        disabled={disabled || isSubmitting}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 cursor-pointer",
          className,
        )}
        aria-label={mode === "reinherit" ? "Reinherit" : "Add Beneficiary"}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
        {mode === "reinherit" ? "Reinherit" : "Add Beneficiary"}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm dark:bg-white/10 dark:border-neutral-600",
        className,
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-800 dark:text-white">
            {mode === "reinherit"
              ? "New Successor Wallet Address"
              : "Beneficiary Wallet Address"}
          </label>
          <input
            type="text"
            value={beneficiaryAddress}
            onChange={(e) => {
              setBeneficiaryAddress(e.target.value);
              setError(null);
            }}
            placeholder="0x..."
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:outline-none focus:ring-2 dark:bg-white/10 dark:text-white dark:placeholder:text-neutral-400",
              isSameAsCurrentWallet ||
                (beneficiaryAddress.trim() !== "" && !isValidAddress)
                ? "border-red-500 focus:border-red-500 focus:ring-red-300 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-700"
                : "border-neutral-200 focus:border-neutral-400 focus:ring-neutral-300 dark:border-neutral-600 dark:focus:border-neutral-500 dark:focus:ring-neutral-700",
            )}
            aria-label="Beneficiary wallet address"
            required
            disabled={isSubmitting}
          />
          {isSameAsCurrentWallet && (
            <p className="text-xs text-red-600 dark:text-red-400">
              ⚠️ You cannot set your own wallet address as the beneficiary.
            </p>
          )}
          {beneficiaryAddress.trim() !== "" &&
            !isValidAddress &&
            !isSameAsCurrentWallet && (
              <p className="text-xs text-red-600 dark:text-red-400">
                ⚠️ Please enter a valid Ethereum address.
              </p>
            )}
          {isValidAddress && !isSameAsCurrentWallet && (
            <p className="text-xs text-neutral-600 dark:text-neutral-200">
              ✓ Valid Ethereum address
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isSubmitting
              ? mode === "reinherit"
                ? "Reinheriting..."
                : "Adding..."
              : mode === "reinherit"
              ? "Reinherit"
              : "Add Beneficiary"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
