"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Identity } from "@semaphore-protocol/identity";
import { getVaults, checkMember } from "@/services/relayerAPI";
import { cn } from "@/lib/utils";

interface Vault {
  vaultId: string;
  index: number;
  isMember?: boolean;
  isLoading?: boolean;
}

interface GetVaultsProps {
  className?: string;
  onVaultSelected?: (vaultId: string) => void;
  showOnlyUserVaults?: boolean;
  allowSelection?: boolean;
}

export default function GetVaults({
  className,
  onVaultSelected,
  showOnlyUserVaults = false,
  allowSelection = true,
}: GetVaultsProps) {
  const { user } = usePrivy();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userIdentityCommitment, setUserIdentityCommitment] = useState<bigint | null>(null);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [showUserVaultsOnly, setShowUserVaultsOnly] = useState(showOnlyUserVaults);

  // Generate user's identity commitment from their wallet address
  useEffect(() => {
    if (user?.wallet?.address) {
      try {
        const identity = new Identity(user.wallet.address);
        setUserIdentityCommitment(identity.commitment);
      } catch (err) {
        console.error("Failed to generate identity commitment:", err);
      }
    }
  }, [user?.wallet?.address]);

  // Fetch all vaults
  useEffect(() => {
    const fetchVaults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getVaults();
        setVaults(result.vaults.map((v: { vaultId: string; index: number }) => ({
          ...v,
          isMember: undefined,
          isLoading: true
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch vaults");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaults();
  }, []);

  // Check membership for each vault
  useEffect(() => {
    if (!userIdentityCommitment || vaults.length === 0) return;

    const checkMemberships = async () => {
      const updatedVaults = await Promise.all(
        vaults.map(async (vault) => {
          try {
            const result = await checkMember(userIdentityCommitment, parseInt(vault.vaultId));
            return {
              ...vault,
              isMember: result.isMember,
              isLoading: false,
            };
          } catch (err) {
            console.error(`Failed to check membership for vault ${vault.vaultId}:`, err);
            return {
              ...vault,
              isMember: false,
              isLoading: false,
            };
          }
        })
      );

      setVaults(updatedVaults);
    };

    checkMemberships();
  }, [userIdentityCommitment, vaults.length]);

  const displayVaults = showUserVaultsOnly
    ? vaults.filter((v) => v.isMember === true)
    : vaults;

  const handleVaultClick = (vaultId: string) => {
    if (allowSelection) {
      setSelectedVaultId(vaultId);
    }
    if (onVaultSelected) {
      onVaultSelected(vaultId);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("rounded-xl border bg-white p-6 shadow-sm dark:bg-white/10 dark:border-neutral-600", className)}>
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-600 dark:border-t-white" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading vaults...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:bg-red-900/20 dark:border-red-800", className)}>
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">Error loading vaults</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (displayVaults.length === 0) {
    return (
      <div className={cn("rounded-xl border bg-white p-6 shadow-sm dark:bg-white/10 dark:border-neutral-600", className)}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-neutral-900 dark:text-white">
            {showOnlyUserVaults ? "No vaults found" : "No vaults available"}
          </h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {showOnlyUserVaults
              ? "You are not a member of any vaults yet."
              : "No vaults have been created yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Vaults
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            {displayVaults.length} {displayVaults.length === 1 ? "vault" : "vaults"}
          </span>
        </div>
      </div>

      {/* Toggle for filtering user vaults */}
      <div className="flex items-center justify-between rounded-lg border bg-neutral-50 p-3 dark:bg-neutral-800/50 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            Show only my vaults
          </span>
        </div>
        <button
          onClick={() => setShowUserVaultsOnly(!showUserVaultsOnly)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900",
            showUserVaultsOnly ? "bg-blue-600 dark:bg-blue-500" : "bg-neutral-300 dark:bg-neutral-600"
          )}
          aria-pressed={showUserVaultsOnly}
          aria-label="Toggle show only my vaults"
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              showUserVaultsOnly ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      <div className="space-y-2">
        {displayVaults.map((vault) => (
          <div
            key={vault.vaultId}
            className={cn(
              "rounded-lg border bg-white p-4 shadow-sm transition dark:bg-white/10 dark:border-neutral-600",
              (allowSelection || onVaultSelected) && "cursor-pointer hover:border-blue-300 hover:shadow-md dark:hover:border-blue-600",
              selectedVaultId === vault.vaultId && "border-blue-500 ring-2 ring-blue-200 dark:border-blue-400 dark:ring-blue-900/50"
            )}
            onClick={() => handleVaultClick(vault.vaultId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Vault #{vault.vaultId}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Index: {vault.index}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {vault.isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-600 dark:border-t-white" />
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Checking...</span>
                  </div>
                ) : vault.isMember ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 dark:bg-green-900/30">
                    <svg className="h-3.5 w-3.5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Member</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 dark:bg-neutral-800">
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Not a member</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
