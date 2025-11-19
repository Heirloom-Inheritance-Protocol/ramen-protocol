"use client";

import { JSX, useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  getOwnerInheritances,
  getSuccessorInheritances,
  deleteInheritance,
  reinherit,
  InheritanceData,
} from "@/lib/services/heriloomProtocol";
import { decryptFileForBoth } from "@/lib/encryption";
import { isAddress } from "viem";
import IdentityCreation from "../IdentityCreation";

export function ReceivedInheritances(): JSX.Element {
  const { user } = usePrivy();
  const [inheritances, setInheritances] = useState<InheritanceData[]>([]);
  const [successorInheritances, setSuccessorInheritances] = useState<
    InheritanceData[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [successorSearchQuery, setSuccessorSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [downloadingId, setDownloadingId] = useState<bigint | null>(null);
  const [reinheritingId, setReinheritingId] = useState<bigint | null>(null);
  const reinheritingIdRef = useRef<bigint | null>(null);
  const [showReinheritModal, setShowReinheritModal] = useState(false);
  const [newSuccessorAddress, setNewSuccessorAddress] = useState("");
  const [reinheritingLoading, setReinheritingLoading] = useState(false);
  const [hasIdentity, setHasIdentity] = useState(false);

  // Check for identity in localStorage
  useEffect(() => {
    const checkIdentity = () => {
      if (typeof window !== "undefined") {
        const commitment = localStorage.getItem("semaphoreCommitment");
        setHasIdentity(!!commitment);
      }
    };

    checkIdentity();

    // Listen for storage changes (when identity is created in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "semaphoreCommitment") {
        checkIdentity();
      }
    };

    // Listen for custom event (when identity is created in same window)
    const handleIdentityCreated = () => {
      checkIdentity();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("identityCreated", handleIdentityCreated);

    // Also check periodically as a fallback
    const interval = setInterval(checkIdentity, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("identityCreated", handleIdentityCreated);
      clearInterval(interval);
    };
  }, []);

  // Fetch inheritances from blockchain
  useEffect(() => {
    async function fetchInheritances() {
      if (!user?.wallet?.address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch both owner and successor inheritances in parallel
        const [ownerData, successorData] = await Promise.all([
          getOwnerInheritances(user.wallet.address as `0x${string}`),
          getSuccessorInheritances(user.wallet.address as `0x${string}`),
        ]);

        setInheritances(ownerData);
        setSuccessorInheritances(successorData);
      } catch (error) {
        console.error("Error fetching inheritances:", error);
        setError("Failed to fetch inheritances from blockchain");
      } finally {
        setLoading(false);
      }
    }

    fetchInheritances();
  }, [user?.wallet?.address]);

  // Group inheritances by IPFS hash to show multiple successors in same row
  interface GroupedInheritance {
    ipfsHash: string;
    fileName: string;
    tag: string;
    fileSize: bigint;
    timestamp: bigint;
    owner: string;
    successors: Array<{
      id: bigint;
      address: string;
      timestamp: bigint;
      isActive: boolean;
      isClaimed: boolean;
    }>;
  }

  const groupedByIpfs = inheritances.reduce((acc, inheritance) => {
    const key = inheritance.ipfsHash;
    if (!acc[key]) {
      acc[key] = {
        ipfsHash: inheritance.ipfsHash,
        fileName: inheritance.fileName,
        tag: inheritance.tag,
        fileSize: inheritance.fileSize,
        timestamp: inheritance.timestamp,
        owner: inheritance.owner,
        successors: [],
      };
    }
    acc[key].successors.push({
      id: inheritance.id,
      address: inheritance.successor,
      timestamp: inheritance.timestamp,
      isActive: inheritance.isActive,
      isClaimed: inheritance.isClaimed,
    });
    // Use the earliest timestamp
    if (inheritance.timestamp < acc[key].timestamp) {
      acc[key].timestamp = inheritance.timestamp;
    }
    return acc;
  }, {} as Record<string, GroupedInheritance>);

  const receivedAssets = Object.values(groupedByIpfs);

  // Filter by search query
  const filteredAssets = receivedAssets.filter((group) => {
    const query = searchQuery.toLowerCase();
    const allSuccessors = group.successors
      .map((s) => s.address.toLowerCase())
      .join(" ");
    return (
      group.fileName.toLowerCase().includes(query) ||
      group.tag.toLowerCase().includes(query) ||
      allSuccessors.includes(query)
    );
  });

  // Filter successor inheritances by search query
  const filteredSuccessorAssets = successorInheritances.filter(
    (inheritance) => {
      const query = successorSearchQuery.toLowerCase();
      return (
        inheritance.fileName.toLowerCase().includes(query) ||
        inheritance.tag.toLowerCase().includes(query) ||
        inheritance.owner.toLowerCase().includes(query)
      );
    },
  );

  function formatDate(timestamp: bigint): string {
    return new Date(Number(timestamp) * 1000).toISOString().split("T")[0];
  }

  function formatSize(bytes: bigint): string {
    return `${(Number(bytes) / 1024 / 1024).toFixed(1)} MB`;
  }

  function shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function getIpfsUrl(ipfsHash: string): string {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }

  function splitFileName(fileName: string): {
    name: string;
    extension: string;
  } {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return { name: fileName, extension: "" };
    }
    return {
      name: fileName.substring(0, lastDotIndex),
      extension: fileName.substring(lastDotIndex),
    };
  }

  async function handleDelete(inheritanceId: bigint) {
    if (
      !confirm(
        "Are you sure you want to delete this inheritance? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setDeletingId(inheritanceId);
      await deleteInheritance(inheritanceId);

      // Remove the deleted inheritance from the list
      setInheritances((prev) =>
        prev.filter((inheritance) => inheritance.id !== inheritanceId),
      );
    } catch (error) {
      console.error("Error deleting inheritance:", error);
      alert(
        "Failed to delete inheritance. Please try again. Error: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownloadAndDecrypt(
    inheritance: InheritanceData,
    userAddress: string,
  ) {
    try {
      setDownloadingId(inheritance.id);
      console.log("Fetching encrypted file from IPFS...");

      // 1. Fetch encrypted file from IPFS
      const ipfsUrl = getIpfsUrl(inheritance.ipfsHash);
      const response = await fetch(ipfsUrl);
      if (!response.ok) throw new Error("Failed to fetch from IPFS");

      const encryptedPackage = await response.arrayBuffer();
      console.log("File fetched, decrypting...");

      // 2. Decrypt using user's address (works for both owner and successor)
      const decryptedData = await decryptFileForBoth(
        encryptedPackage,
        userAddress,
        inheritance.owner,
        inheritance.successor,
      );

      // 3. Create downloadable blob
      const blob = new Blob([decryptedData], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // 4. Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = inheritance.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("File decrypted and downloaded successfully");
    } catch (error) {
      console.error("Decryption failed:", error);
      alert(
        "Failed to decrypt file. You may not be authorized to access this file. Error: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setDownloadingId(null);
    }
  }

  function handleOpenReinheritModal(inheritanceId: bigint) {
    console.log("Opening modal with inheritance ID:", inheritanceId);
    reinheritingIdRef.current = inheritanceId;
    setReinheritingId(inheritanceId);
    setNewSuccessorAddress("");
    setShowReinheritModal(true);
    console.log("Ref set to:", reinheritingIdRef.current);
  }

  function handleCloseReinheritModal() {
    console.log("Closing modal - clearing ref and state");
    setShowReinheritModal(false);
    setReinheritingId(null);
    reinheritingIdRef.current = null;
    setNewSuccessorAddress("");
  }

  async function handleReinherit() {
    console.log(
      "handleReinherit called - ref:",
      reinheritingIdRef.current,
      "state:",
      reinheritingId,
    );
    const inheritanceId = reinheritingIdRef.current ?? reinheritingId;
    console.log(
      "Final inheritanceId:",
      inheritanceId,
      "typeof:",
      typeof inheritanceId,
    );

    const trimmedAddress = newSuccessorAddress.trim();

    // Check if inheritanceId is null or undefined (but allow 0n which is a valid BigInt)
    if (inheritanceId === null || inheritanceId === undefined) {
      console.error(
        "No inheritance ID found! ref:",
        reinheritingIdRef.current,
        "state:",
        reinheritingId,
      );
      alert(
        "Error: No inheritance selected. Please close and reopen the modal.",
      );
      return;
    }

    if (!trimmedAddress) {
      alert("Please enter a successor address");
      return;
    }

    // Validate address format using viem's isAddress
    if (!isAddress(trimmedAddress)) {
      alert(
        "Please enter a valid Ethereum address (0x followed by 40 hex characters)",
      );
      return;
    }

    // Check if user is trying to reinherit to themselves
    const userAddress = user?.wallet?.address?.toLowerCase();
    if (userAddress && trimmedAddress.toLowerCase() === userAddress) {
      alert(
        "You cannot reinherit to yourself. Please enter a different wallet address.",
      );
      return;
    }

    // Find the inheritance being reinherited and check if new successor already exists
    const allInheritancesList = [...inheritances, ...successorInheritances];
    const currentInheritance = allInheritancesList.find(
      (inh) => inh.id === inheritanceId,
    );

    if (currentInheritance) {
      // Get all inheritances with the same IPFS hash
      const sameIpfsInheritances = allInheritancesList.filter(
        (inh) =>
          inh.ipfsHash.toLowerCase() ===
          currentInheritance.ipfsHash.toLowerCase(),
      );

      // Check if the new successor address already exists as a successor for this IPFS hash
      const alreadySuccessor = sameIpfsInheritances.some(
        (inh) => inh.successor.toLowerCase() === trimmedAddress.toLowerCase(),
      );

      if (alreadySuccessor) {
        alert(
          "This address is already a successor for this inheritance. Please enter a different wallet address.",
        );
        return;
      }
    }

    try {
      setReinheritingLoading(true);
      const newInheritanceId = await reinherit(
        inheritanceId,
        trimmedAddress as `0x${string}`,
      );

      // Refresh the inheritances list
      if (user?.wallet?.address) {
        const [ownerData, successorData] = await Promise.all([
          getOwnerInheritances(user.wallet.address as `0x${string}`),
          getSuccessorInheritances(user.wallet.address as `0x${string}`),
        ]);

        setInheritances(ownerData);
        setSuccessorInheritances(successorData);
      }

      alert(
        `Inheritance successfully passed down! New inheritance ID: ${newInheritanceId.toString()}`,
      );
      handleCloseReinheritModal();
    } catch (error) {
      console.error("Reinherit failed:", error);
      alert(
        "Failed to reinherit. Please try again. Error: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setReinheritingLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center dark:border-red-700/50 dark:bg-red-900/10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!user?.wallet?.address) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-white/60 p-12 text-center backdrop-blur-sm dark:border-blue-700/50 dark:bg-white/5">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Please connect your wallet to view your inheritances
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 overflow-hidden rounded-3xl bg-linear-to-br from-blue-50/80 via-sky-50/60 to-cyan-50/70 p-8 shadow-xl shadow-blue-200/40 backdrop-blur-xl before:pointer-events-none before:absolute before:-inset-1 before:-z-10 before:opacity-90 before:blur-3xl before:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.4),transparent_50%)] dark:from-blue-100/30 dark:via-sky-100/20 dark:to-cyan-100/25 dark:shadow-blue-300/30 dark:before:bg-[radial-gradient(circle_at_bottom_right,rgba(125,211,252,0.5),transparent_55%)]">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Inheritance Vaults
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Files you&apos;ve designated for inheritance
            </p>
          </div>
          <div className="rounded-full bg-linear-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {receivedAssets.length}{" "}
            {receivedAssets.length === 1 ? "file" : "files"}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by filename, tag, or sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-12 pr-4 text-sm text-neutral-900 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-neutral-600 dark:bg-white/10 dark:text-white dark:placeholder:text-neutral-400 dark:focus:border-blue-500 dark:focus:ring-blue-700"
          />
        </div>
      </div>

      {/* Table */}
      {filteredAssets.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-white/60 p-12 text-center backdrop-blur-sm dark:border-blue-700/50 dark:bg-white/5">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">
            No inheritances found
          </h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {searchQuery
              ? "Try adjusting your search query"
              : "You haven't created any inheritances yet. Go to the Inheritance tab to create one."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto md:overflow-hidden rounded-xl border border-white/20 bg-white/90 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          <div>
            <table className="w-full table-auto min-w-[900px] md:min-w-0">
              <thead>
                <tr className="border-b border-neutral-200/50 bg-white/40 dark:border-neutral-700/50 dark:bg-white/5">
                  <th className="w-[12%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    File
                  </th>
                  <th className="w-[12%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    Successor(s)
                  </th>
                  <th className="w-[10%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    Created
                  </th>
                  <th className="w-[8%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    Size
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    Tags
                  </th>
                  <th className="w-[20%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/30 dark:divide-neutral-700/30">
                {filteredAssets.map((group) => (
                  <tr
                    key={group.ipfsHash}
                    className="bg-transparent transition hover:bg-white/40 dark:hover:bg-white/10"
                  >
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg
                          className="h-5 w-5 shrink-0 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                          <path d="M14 2v6h6" fill="white" />
                        </svg>
                        <div className="flex items-center min-w-0 text-sm font-normal text-neutral-900 dark:text-white">
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                            {splitFileName(group.fileName).name}
                          </span>
                          <span className="shrink-0">
                            {splitFileName(group.fileName).extension}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col gap-1.5">
                        {group.successors.map((successor, idx) => {
                          const inheritanceData = inheritances.find(
                            (inh) => inh.id === successor.id,
                          );
                          return (
                            <div
                              key={successor.id.toString()}
                              className="flex items-center gap-2"
                            >
                              <span className="font-mono text-sm text-neutral-700 dark:text-neutral-300">
                                {shortenAddress(successor.address)}
                              </span>
                              {inheritanceData && (
                                <button
                                  onClick={() => handleDelete(successor.id)}
                                  disabled={deletingId === successor.id}
                                  className="inline-flex items-center justify-center rounded-lg bg-red-600 p-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600 cursor-pointer"
                                  aria-label="Delete inheritance"
                                >
                                  {deletingId === successor.id ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  ) : (
                                    <svg
                                      className="h-3 w-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {formatDate(group.timestamp)}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {formatSize(group.fileSize)}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-wrap gap-1">
                        {group.tag.split(",").map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            // Use the first active inheritance for download
                            const firstActive =
                              group.successors.find((s) => s.isActive) ||
                              group.successors[0];
                            const inheritanceData = inheritances.find(
                              (inh) => inh.id === firstActive.id,
                            );
                            if (inheritanceData) {
                              handleDownloadAndDecrypt(
                                inheritanceData,
                                user?.wallet?.address || "",
                              );
                            }
                          }}
                          disabled={downloadingId !== null}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white cursor-pointer"
                        >
                          {downloadingId !== null ? (
                            <>
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-neutral-900 dark:border-t-transparent" />
                              Decrypting...
                            </>
                          ) : (
                            <>
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
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              Download
                            </>
                          )}
                        </button>
                        {(() => {
                          // Get the first active successor for reinherit
                          const firstActiveSuccessor = group.successors.find(
                            (s) => s.isActive,
                          );
                          if (!firstActiveSuccessor) return null;
                          const inheritanceData = inheritances.find(
                            (inh) => inh.id === firstActiveSuccessor.id,
                          );
                          if (!inheritanceData) return null;
                          return (
                            <button
                              onClick={() =>
                                handleOpenReinheritModal(
                                  firstActiveSuccessor.id,
                                )
                              }
                              disabled={
                                reinheritingId === firstActiveSuccessor.id
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 cursor-pointer"
                              aria-label="Reinherit"
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
                              Reinherit
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Received as Beneficiary Section */}
      <div className="mt-12 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Received Inheritances
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Files you&apos;ve been designated to inherit
            </p>
          </div>
          <div className="rounded-full bg-linear-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {successorInheritances.length}{" "}
            {successorInheritances.length === 1 ? "file" : "files"}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by filename, tag, or owner..."
            value={successorSearchQuery}
            onChange={(e) => setSuccessorSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-12 pr-4 text-sm text-neutral-900 shadow-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:border-neutral-600 dark:bg-white/10 dark:text-white dark:placeholder:text-neutral-400 dark:focus:border-purple-500 dark:focus:ring-purple-700"
          />
        </div>

        {/* Table */}
        {filteredSuccessorAssets.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-white/60 p-12 text-center backdrop-blur-sm dark:border-purple-700/50 dark:bg-white/5">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">
              No inheritances received
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {successorSearchQuery
                ? "Try adjusting your search query"
                : "You haven't been designated as a beneficiary for any inheritances yet."}
            </p>
          </div>
        ) : !hasIdentity ? (
          <IdentityCreation />
        ) : (
          <div className="overflow-x-auto md:overflow-hidden rounded-xl border border-white/20 bg-white/90 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <div>
              <table className="w-full table-auto min-w-[900px] md:min-w-0">
                <thead>
                  <tr className="border-b border-neutral-200/50 bg-white/40 dark:border-neutral-700/50 dark:bg-white/5">
                    <th className="w-[12%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      File
                    </th>
                    <th className="w-[12%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      From
                    </th>
                    <th className="w-[10%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      Created
                    </th>
                    <th className="w-[8%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      Size
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      Tags
                    </th>
                    <th className="w-[20%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/30 dark:divide-neutral-700/30">
                  {filteredSuccessorAssets.map((inheritance) => (
                    <tr
                      key={inheritance.id.toString()}
                      className="bg-transparent transition hover:bg-white/40 dark:hover:bg-white/10"
                    >
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2 min-w-0">
                          <svg
                            className="h-5 w-5 shrink-0 text-purple-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                            <path d="M14 2v6h6" fill="white" />
                          </svg>
                          <div className="flex items-center min-w-0 text-sm font-normal text-neutral-900 dark:text-white">
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                              {splitFileName(inheritance.fileName).name}
                            </span>
                            <span className="shrink-0">
                              {splitFileName(inheritance.fileName).extension}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span className="font-mono text-sm text-neutral-700 dark:text-neutral-300">
                          {shortenAddress(inheritance.owner)}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {formatDate(inheritance.timestamp)}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {formatSize(inheritance.fileSize)}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex flex-wrap gap-1">
                          {inheritance.tag.split(",").map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              window.open(
                                getIpfsUrl(inheritance.ipfsHash),
                                "_blank",
                              )
                            }
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
                            aria-label="Open in new tab"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadAndDecrypt(
                                inheritance,
                                user?.wallet?.address || "",
                              )
                            }
                            disabled={downloadingId === inheritance.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white cursor-pointer"
                          >
                            {downloadingId === inheritance.id ? (
                              <>
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-neutral-900 dark:border-t-transparent" />
                                Decrypting...
                              </>
                            ) : (
                              <>
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
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                                Download
                              </>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleOpenReinheritModal(inheritance.id)
                            }
                            disabled={
                              reinheritingId === inheritance.id ||
                              !inheritance.isActive
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 cursor-pointer"
                            aria-label="Reinherit"
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
                            Reinherit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reinherit Modal */}
      {showReinheritModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleCloseReinheritModal}
        >
          <div
            className="relative m-4 w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-neutral-900 animate-in fade-in-0 zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCloseReinheritModal}
              className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              aria-label="Close modal"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Modal content */}
            <div className="px-6 pb-6 pt-12">
              <h3 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">
                Reinherit Asset
              </h3>
              <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
                Enter the address of the new successor to pass down this
                inheritance.
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="new-successor"
                    className="mb-2 block text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    New Successor Address
                  </label>
                  <input
                    id="new-successor"
                    type="text"
                    placeholder="0x..."
                    value={newSuccessorAddress}
                    onChange={(e) => setNewSuccessorAddress(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 px-4 text-sm text-neutral-900 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-neutral-600 dark:bg-white/10 dark:text-white dark:placeholder:text-neutral-400 dark:focus:border-blue-500 dark:focus:ring-blue-700"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseReinheritModal}
                    disabled={reinheritingLoading}
                    className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReinherit}
                    disabled={
                      reinheritingLoading || !newSuccessorAddress.trim()
                    }
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    {reinheritingLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing...
                      </div>
                    ) : (
                      "Reinherit"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
