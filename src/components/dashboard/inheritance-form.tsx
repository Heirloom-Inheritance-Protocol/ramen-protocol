"use client";

import { JSX, useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { cn } from "@/lib/utils";
import { SuccessModal } from "@/components/ui/success-modal";
import {
  createInheritance,
  getOwnerInheritances,
  InheritanceData,
} from "@/lib/services/heriloomProtocol";
import { encryptFileForBoth } from "@/lib/encryption";
import { CreateInheritanceButton } from "@/components/CreateGroup";

interface InheritanceFormProps {
  className?: string;
}

interface Asset {
  successorWallet: string;
  file: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
  tag: string;
  ipfsHash: string;
  ipfsUrl: string;
}

const TAG_TYPES = [
  "recipe",
  "handcraft",
  "legacy-knowledge",
  "legal",
  "menu",
  "recipe",
  "handcraft",
  "legacy-knowledge",
  "legal",
  "menu",
  "deed",
  "proper",
  "finance",
  "investor",
] as const;

export function InheritanceForm({
  className,
}: InheritanceFormProps): JSX.Element {
  const { user } = usePrivy();
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [successorWallet, setSuccessorWallet] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inheritances, setInheritances] = useState<InheritanceData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingStage, setUploadingStage] = useState<
    "idle" | "ipfs" | "blockchain"
  >("idle");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAsset, setSuccessAsset] = useState<Asset | null>(null);
  const [loadingInheritances, setLoadingInheritances] = useState(false);

  // Fetch inheritances from blockchain
  useEffect(() => {
    async function fetchInheritances() {
      if (!user?.wallet?.address) {
        return;
      }

      try {
        setLoadingInheritances(true);
        const data = await getOwnerInheritances(
          user.wallet.address as `0x${string}`,
        );
        setInheritances(data);
      } catch (error) {
        console.error("Error fetching inheritances:", error);
      } finally {
        setLoadingInheritances(false);
      }
    }

    fetchInheritances();
  }, [user?.wallet?.address]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!selectedFile) return;

    if (!user?.wallet?.address) {
      alert("Please connect your wallet first");
      return;
    }

    setUploading(true);
    setUploadingStage("ipfs");
    try {
      // 1. Encrypt the file for both owner and successor
      console.log(
        "Encrypting file for owner and successor:",
        user.wallet.address,
        successorWallet,
      );
      const { encryptedPackage } = await encryptFileForBoth(
        selectedFile,
        user.wallet.address,
        successorWallet,
      );

      // 2. Upload encrypted package to IPFS
      const formData = new FormData();
      formData.append(
        "file",
        encryptedPackage,
        `${selectedFile.name}.encrypted`,
      );

      console.log("Uploading encrypted file to IPFS...");

      const response = await fetch("/api/upload-ipfs", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      console.log("Encrypted file uploaded to IPFS:", data);

      // Create inheritance on blockchain
      setUploadingStage("blockchain");
      console.log("Creating inheritance on blockchain...");
      const inheritanceId = await createInheritance({
        successor: successorWallet as `0x${string}`,
        ipfsHash: data.hash,
        tag: selectedTag,
        fileName: selectedFile.name,
        fileSize: BigInt(selectedFile.size),
      });

      console.log("Inheritance created with ID:", inheritanceId.toString());

      // Save to Arkiv database
      try {
        const arkivPayload = JSON.stringify({
          inheritanceId: inheritanceId.toString(),
          owner: user.wallet.address,
          successor: successorWallet,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          tag: selectedTag,
          ipfsHash: data.hash,
          ipfsUrl: data.url,
          createdAt: new Date().toISOString(),
        });

        const arkivResponse = await fetch("/api/arkiv", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payload: arkivPayload,
            contentType: "application/json",
            attributes: [
              { key: "type", value: "inheritance-asset" },
              { key: "inheritanceId", value: inheritanceId.toString() },
              { key: "tag", value: selectedTag },
            ],
            expiresIn: 86400 * 365, // 1 year expiration
          }),
        });

        if (arkivResponse.ok) {
          const arkivData = await arkivResponse.json();
          console.log("Asset saved to Arkiv:", arkivData);
        } else {
          console.warn("Failed to save to Arkiv, but inheritance was created");
        }
      } catch (arkivError) {
        console.error("Error saving to Arkiv:", arkivError);
        // Don't fail the whole process if Arkiv save fails
      }

      // Refresh inheritances from blockchain
      if (user?.wallet?.address) {
        setLoadingInheritances(true);
        try {
          const updatedInheritances = await getOwnerInheritances(
            user.wallet.address as `0x${string}`,
          );
          setInheritances(updatedInheritances);
        } finally {
          setLoadingInheritances(false);
        }
      }

      // Create asset object for success modal
      const newAsset: Asset = {
        successorWallet,
        file: {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          lastModified: selectedFile.lastModified,
        },
        tag: selectedTag,
        ipfsHash: data.hash,
        ipfsUrl: data.url,
      };

      // Show success modal
      setSuccessAsset(newAsset);
      setShowSuccessModal(true);

      // Reset form
      setSuccessorWallet("");
      setSelectedFile(null);
      setSelectedTag("");
    } catch (error) {
      console.error("Error creating inheritance:", error);
      alert("Error creating inheritance: " + (error as Error).message);
    } finally {
      setUploading(false);
      setUploadingStage("idle");
    }
  }

  const currentWalletAddress = user?.wallet?.address?.toLowerCase();
  const isSameAsCurrentWallet =
    currentWalletAddress &&
    successorWallet.toLowerCase() === currentWalletAddress;

  const isFormValid =
    successorWallet.trim() !== "" &&
    selectedFile !== null &&
    selectedTag !== "" &&
    !isSameAsCurrentWallet;

  return (
    <>
      <div className="flex w-full justify-center">
        <form
          onSubmit={handleSubmit}
          className={cn(
            "relative flex w-full max-w-2xl flex-col gap-8 overflow-hidden rounded-3xl bg-linear-to-br from-blue-50/80 via-sky-50/60 to-cyan-50/70 p-8 shadow-xl shadow-blue-200/40 backdrop-blur-xl before:pointer-events-none before:absolute before:-inset-1 before:-z-10 before:opacity-90 before:blur-3xl before:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.4),transparent_50%)] dark:from-blue-100/30 dark:via-sky-100/20 dark:to-cyan-100/25 dark:shadow-blue-300/30 dark:before:bg-[radial-gradient(circle_at_bottom_right,rgba(125,211,252,0.5),transparent_55%)]",
            className,
          )}
        >
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Create Inheritance
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-100">
              Upload a PDF file and designate a successor wallet
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-200">
              🔐 Your PDF will be encrypted client-side with AES-256-GCM before
              being uploaded to IPFS. Both you (the owner) and the designated
              successor can decrypt and download it using your respective wallet
              addresses.
            </p>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-neutral-800 dark:text-white">
              Successor Wallet
            </span>
            <input
              value={successorWallet}
              onChange={(event) => setSuccessorWallet(event.target.value)}
              placeholder="0x..."
              className={cn(
                "w-full rounded-xl border bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm transition focus:outline-none focus:ring-2 dark:bg-white/10 dark:text-white dark:placeholder:text-neutral-400",
                isSameAsCurrentWallet
                  ? "border-red-500 focus:border-red-500 focus:ring-red-300 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-700"
                  : "border-neutral-200 focus:border-neutral-400 focus:ring-neutral-300 dark:border-neutral-600 dark:focus:border-neutral-500 dark:focus:ring-neutral-700",
              )}
              aria-label="Successor wallet address"
              name="successorWallet"
              required
            />
            {isSameAsCurrentWallet ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                ⚠️ You cannot set your own wallet address as the successor.
                Please use a different address.
              </p>
            ) : (
              <p className="text-xs text-neutral-600 dark:text-neutral-200">
                The wallet address that will inherit this data
              </p>
            )}
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium text-neutral-800 dark:text-white">
              Inheritance Document
            </span>
            <label
              htmlFor="inheritance-file"
              className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 bg-white px-6 py-10 text-center transition hover:border-neutral-300 dark:border-neutral-600 dark:bg-white/10 dark:hover:border-neutral-500"
            >
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {selectedFile ? selectedFile.name : "Click to upload PDF"}
              </span>
              <span className="text-xs text-neutral-600 dark:text-neutral-300">
                {selectedFile
                  ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                  : "PDF files only, up to 50MB"}
              </span>
              <input
                id="inheritance-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                name="inheritanceFile"
                required
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-neutral-800 dark:text-white">
              Tag Type
            </span>
            <select
              value={selectedTag}
              onChange={(event) => setSelectedTag(event.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-600 dark:bg-white/10 dark:text-white dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
              aria-label="Select inheritance tag type"
            >
              <option value="">Select a tag type</option>
              {TAG_TYPES.map((tagType, index) => (
                <option key={tagType + index} value={tagType}>
                  {tagType.charAt(0).toUpperCase() + tagType.slice(1)}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-600 dark:text-neutral-200">
              Select a tag type to categorize your inheritance
            </p>
          </label>

          <CreateInheritanceButton
            type="submit"
            disabled={!isFormValid || uploading}
            uploadingStage={uploadingStage}
          />

          {(loadingInheritances || inheritances.length > 0) && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Created Inheritances ({inheritances.length})
              </h3>
              {loadingInheritances ? (
                <div className="flex items-center justify-center rounded-xl bg-white/50 p-8 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Loading inheritances...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {inheritances.map((inheritance) => (
                    <div
                      key={inheritance.id.toString()}
                      className="rounded-xl bg-white/50 p-4 shadow-sm dark:bg-white/5"
                    >
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {inheritance.fileName}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300">
                        Successor: {inheritance.successor}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300">
                        Tag: {inheritance.tag}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300">
                        Size:{" "}
                        {(Number(inheritance.fileSize) / 1024 / 1024).toFixed(
                          2,
                        )}{" "}
                        MB
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                            inheritance.isClaimed
                              ? "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-400/30"
                              : inheritance.isActive
                              ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-400/30"
                              : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/30",
                          )}
                        >
                          {inheritance.isClaimed
                            ? "Claimed"
                            : inheritance.isActive
                            ? "Available"
                            : "Revoked"}
                        </span>
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${inheritance.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View on IPFS →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Inheritance Created Successfully!"
      >
        {successAsset && (
          <div className="space-y-6">
            <div className="space-y-4 rounded-xl bg-linear-to-br from-neutral-50 to-neutral-100 p-6 dark:from-neutral-800 dark:to-neutral-900">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  File Name
                </p>
                <p className="text-base font-semibold text-neutral-900 dark:text-white">
                  {successAsset.file.name}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {(successAsset.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <div className="h-px bg-neutral-200 dark:bg-neutral-700" />

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Successor Wallet
                </p>
                <p className="break-all font-mono text-sm text-neutral-900 dark:text-white">
                  {successAsset.successorWallet}
                </p>
              </div>

              <div className="h-px bg-neutral-200 dark:bg-neutral-700" />

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Tag Type
                </p>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {successAsset.tag.charAt(0).toUpperCase() +
                    successAsset.tag.slice(1)}
                </span>
              </div>

              <div className="h-px bg-neutral-200 dark:bg-neutral-700" />

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  IPFS Hash
                </p>
                <p className="break-all font-mono text-xs text-neutral-900 dark:text-white">
                  {successAsset.ipfsHash}
                </p>
              </div>
            </div>

            <a
              href={successAsset.ipfsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View on IPFS Gateway
            </a>
          </div>
        )}
      </SuccessModal>
    </>
  );
}
