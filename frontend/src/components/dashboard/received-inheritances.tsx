"use client";

import { JSX, useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  getOwnerInheritances,
  getSuccessorInheritances,
  deleteInheritance,
  InheritanceData,
} from "@/lib/services/heriloomProtocol";
import { decryptFileForBoth } from "@/lib/encryption";

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

  // Show all inheritances
  const receivedAssets = inheritances;

  // Filter by search query
  const filteredAssets = receivedAssets.filter((inheritance) => {
    const query = searchQuery.toLowerCase();
    return (
      inheritance.fileName.toLowerCase().includes(query) ||
      inheritance.tag.toLowerCase().includes(query) ||
      inheritance.successor.toLowerCase().includes(query)
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
        <div className="overflow-hidden rounded-xl border border-white/20 bg-white/90 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          <div>
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-neutral-200/50 bg-white/40 dark:border-neutral-700/50 dark:bg-white/5">
                  <th className="w-[12%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    File
                  </th>
                  <th className="w-[12%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    Successor
                  </th>
                  <th className="w-[10%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    Created
                  </th>
                  <th className="w-[8%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    Size
                  </th>
                  <th className="w-[18%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    Tags
                  </th>
                  <th className="w-[12%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    Status
                  </th>
                  <th className="w-[15%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/30 dark:divide-neutral-700/30">
                {filteredAssets.map((inheritance) => (
                  <tr
                    key={inheritance.id.toString()}
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
                        {shortenAddress(inheritance.successor)}
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
                            className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      {inheritance.isClaimed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-400/30">
                          <svg
                            className="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Claimed
                        </span>
                      ) : inheritance.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-400/30">
                          <svg
                            className="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/30">
                          <svg
                            className="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-1.5">
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
                          onClick={() => handleDelete(inheritance.id)}
                          disabled={deletingId === inheritance.id}
                          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600 cursor-pointer"
                          aria-label="Delete inheritance"
                        >
                          {deletingId === inheritance.id ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
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
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/20 bg-white/90 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <div>
              <table className="w-full table-fixed">
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
                    <th className="w-[18%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      Tags
                    </th>
                    <th className="w-[12%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      Status
                    </th>
                    <th className="w-[15%] px-4 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
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
                        {inheritance.isClaimed ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-400/30">
                            <svg
                              className="h-3 w-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Claimed
                          </span>
                        ) : inheritance.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-400/30">
                            <svg
                              className="h-3 w-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/30">
                            <svg
                              className="h-3 w-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Revoked
                          </span>
                        )}
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
    </div>
  );
}
