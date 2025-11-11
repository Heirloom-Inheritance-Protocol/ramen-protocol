"use client";

import { JSX, useState } from "react";

import { cn } from "@/lib/utils";

interface InheritanceFormProps {
  className?: string;
}

const TAG_TYPES = ["recipe", "handcraft"] as const;

export function InheritanceForm({
  className,
}: InheritanceFormProps): JSX.Element {
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [successorWallet, setSuccessorWallet] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    // Read file as ArrayBuffer (raw binary data)
    const fileArrayBuffer = await selectedFile.arrayBuffer();

    // Read file as Base64 string
    const fileBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(selectedFile);
    });

    const formData = {
      successorWallet,
      file: {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        lastModified: selectedFile.lastModified,
      },
      tag: selectedTag || null,
    };

    console.log("Form Data:", formData);
    console.log("Actual File Object:", selectedFile);
    console.log("File as ArrayBuffer:", fileArrayBuffer);
    console.log("File as Base64:", fileBase64);
  }

  const isFormValid =
    successorWallet.trim() !== "" &&
    selectedFile !== null &&
    selectedTag !== "";

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative flex w-full max-w-2xl flex-col gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50/80 via-sky-50/60 to-cyan-50/70 p-8 shadow-xl shadow-blue-200/40 backdrop-blur-xl before:pointer-events-none before:absolute before:-inset-1 before:-z-10 before:opacity-90 before:blur-3xl before:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.4),transparent_50%)] dark:from-blue-100/30 dark:via-sky-100/20 dark:to-cyan-100/25 dark:shadow-blue-300/30 dark:before:bg-[radial-gradient(circle_at_bottom_right,rgba(125,211,252,0.5),transparent_55%)]",
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
          Your PDF will be encrypted client-side before being uploaded to IPFS.
          Only the designated successor will be able to decrypt and download it.
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
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-600 dark:bg-white/10 dark:text-white dark:placeholder:text-neutral-400 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
          aria-label="Successor wallet address"
          name="successorWallet"
          required
        />
        <p className="text-xs text-neutral-600 dark:text-neutral-200">
          The wallet address that will inherit this data
        </p>
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
          {TAG_TYPES.map((tagType) => (
            <option key={tagType} value={tagType}>
              {tagType.charAt(0).toUpperCase() + tagType.slice(1)}
            </option>
          ))}
        </select>
        <p className="text-xs text-neutral-600 dark:text-neutral-200">
          Select a tag type to categorize your inheritance
        </p>
      </label>

      <button
        type="submit"
        disabled={!isFormValid}
        className="w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-neutral-900 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 dark:disabled:hover:bg-white"
      >
        Create Inheritance
      </button>
    </form>
  );
}
