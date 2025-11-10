"use client";

import { JSX, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

interface InheritanceFormProps {
  className?: string;
}

export function InheritanceForm({
  className,
}: InheritanceFormProps): JSX.Element {
  const [tagValue, setTagValue] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  function handleAddTag(value: string): void {
    const trimmedValue = value.trim();
    if (!trimmedValue || tags.includes(trimmedValue)) {
      return;
    }
    setTags((previousTags) => [...previousTags, trimmedValue]);
    setTagValue("");
  }

  function handleRemoveTag(tagToRemove: string): void {
    setTags((previousTags) =>
      previousTags.filter((existingTag) => existingTag !== tagToRemove),
    );
  }

  const hasTags = useMemo(() => tags.length > 0, [tags]);

  return (
    <form
      className={cn(
        "flex w-full max-w-2xl flex-col gap-8 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900",
        className,
      )}
    >
      <div className="space-y-3 text-center">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          Create Inheritance
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Upload a PDF file and designate a successor wallet
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500">
          Your PDF will be encrypted client-side before being uploaded to IPFS.
          Only the designated successor will be able to decrypt and download it.
        </p>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Successor Wallet
        </span>
        <input
          placeholder="0x..."
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
          aria-label="Successor wallet address"
          name="successorWallet"
          required
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          The wallet address that will inherit this data
        </p>
      </label>

      <div className="space-y-2">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Inheritance Document
        </span>
        <label
          htmlFor="inheritance-file"
          className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center transition hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950/40 dark:hover:border-neutral-600"
        >
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
            Click to upload PDF
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-500">
            PDF files only, up to 50MB
          </span>
          <input
            id="inheritance-file"
            type="file"
            accept=".pdf"
            className="hidden"
            name="inheritanceFile"
            required
          />
        </label>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Add a tag (e.g., menu, contract, will)
        </label>
        <div className="flex items-center gap-2">
          <input
            value={tagValue}
            onChange={(event) => setTagValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddTag(tagValue);
              }
            }}
            placeholder="Add a tag"
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
            aria-label="Add inheritance tag"
          />
          <button
            type="button"
            onClick={() => handleAddTag(tagValue)}
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Add tag
          </button>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          Add tags to categorize and organize your inheritances
        </p>
        {hasTags && (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="group inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 transition dark:bg-neutral-800 dark:text-neutral-200"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="rounded-full bg-neutral-200 px-2 py-1 text-[10px] text-neutral-600 transition hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600"
                  aria-label={`Remove ${tag} tag`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Create Inheritance
      </button>
    </form>
  );
}
