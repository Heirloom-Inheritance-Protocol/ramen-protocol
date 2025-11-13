// encryption.ts - Client-side encryption utilities for digital inheritance

import { isAddress } from "viem";

/**
 * Derives an encryption key from the successor's Ethereum address
 * Uses PBKDF2 for key derivation with the address as input
 */
async function deriveEncryptionKey(address: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const addressBytes = encoder.encode(address.toLowerCase());

  // Import the address as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    addressBytes,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );

  // Derive AES-GCM key using PBKDF2
  const salt = encoder.encode("heirloom-inheritance-salt-v1");
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  return key;
}

/**
 * Encrypts a file using AES-GCM encryption
 * @param file - The file to encrypt
 * @param successorAddress - Ethereum address of the successor
 * @returns Encrypted data as ArrayBuffer and IV (initialization vector)
 */
export async function encryptFile(
  file: File,
  successorAddress: string,
): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array }> {
  try {
    // Validate Ethereum address
    if (!isAddress(successorAddress)) {
      throw new Error("Invalid Ethereum address");
    }

    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Derive encryption key from successor's address
    const encryptionKey = await deriveEncryptionKey(successorAddress);

    // Generate random initialization vector (IV)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the file data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      encryptionKey,
      fileBuffer,
    );

    console.log("File encrypted successfully");
    console.log(
      "IV:",
      Array.from(iv)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    );

    return { encryptedData, iv };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error(`Failed to encrypt file: ${(error as Error).message}`);
  }
}

/**
 * Decrypts an encrypted file using AES-GCM
 * @param encryptedData - The encrypted file data
 * @param iv - Initialization vector used during encryption
 * @param userAddress - Current user's Ethereum address (must be successor)
 * @returns Decrypted file data as ArrayBuffer
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  iv: Uint8Array,
  userAddress: string,
): Promise<ArrayBuffer> {
  try {
    // Validate Ethereum address
    if (!isAddress(userAddress)) {
      throw new Error("Invalid Ethereum address");
    }

    // Derive decryption key from user's address
    const decryptionKey = await deriveEncryptionKey(userAddress);

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      decryptionKey,
      encryptedData,
    );

    console.log("File decrypted successfully");

    return decryptedData;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error(
      "Failed to decrypt file. You may not be the authorized successor.",
    );
  }
}

/**
 * Encrypts a file for BOTH owner and successor
 * Uses a random symmetric key, then encrypts that key for both parties
 */
export async function encryptFileForBoth(
  file: File,
  ownerAddress: string,
  successorAddress: string,
): Promise<{ encryptedPackage: Blob; fileKey: Uint8Array; iv: Uint8Array }> {
  try {
    // Validate addresses
    if (!isAddress(ownerAddress) || !isAddress(successorAddress)) {
      throw new Error("Invalid Ethereum address");
    }

    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Generate a random symmetric key for the file
    const fileKey = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key

    // Import the file key for AES-GCM
    const symmetricKey = await crypto.subtle.importKey(
      "raw",
      fileKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the file with the symmetric key
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      symmetricKey,
      fileBuffer,
    );

    // Derive keys for owner and successor
    const ownerKey = await deriveEncryptionKey(ownerAddress);
    const successorKey = await deriveEncryptionKey(successorAddress);

    // Encrypt the file key for both owner and successor
    const ownerIv = crypto.getRandomValues(new Uint8Array(12));
    const successorIv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedKeyForOwner = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: ownerIv },
      ownerKey,
      fileKey,
    );

    const encryptedKeyForSuccessor = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: successorIv },
      successorKey,
      fileKey,
    );

    // Package everything together:
    // [IV (12)][Owner IV (12)][Successor IV (12)][Owner Encrypted Key (48)][Successor Encrypted Key (48)][Encrypted Data]
    const ownerKeyArray = new Uint8Array(encryptedKeyForOwner);
    const successorKeyArray = new Uint8Array(encryptedKeyForSuccessor);
    const encryptedDataArray = new Uint8Array(encryptedData);

    const totalSize =
      12 +
      12 +
      12 +
      ownerKeyArray.length +
      successorKeyArray.length +
      encryptedDataArray.length;
    const combined = new Uint8Array(totalSize);

    let offset = 0;
    combined.set(iv, offset);
    offset += 12;
    combined.set(ownerIv, offset);
    offset += 12;
    combined.set(successorIv, offset);
    offset += 12;
    combined.set(ownerKeyArray, offset);
    offset += ownerKeyArray.length;
    combined.set(successorKeyArray, offset);
    offset += successorKeyArray.length;
    combined.set(encryptedDataArray, offset);

    console.log("File encrypted for both owner and successor");

    return {
      encryptedPackage: new Blob([combined], {
        type: "application/octet-stream",
      }),
      fileKey,
      iv,
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error(`Failed to encrypt file: ${(error as Error).message}`);
  }
}

/**
 * Decrypts a file encrypted for both owner and successor
 */
export async function decryptFileForBoth(
  packagedData: ArrayBuffer,
  userAddress: string,
  ownerAddress: string,
  successorAddress: string,
): Promise<ArrayBuffer> {
  try {
    // Validate addresses
    if (!isAddress(userAddress)) {
      throw new Error("Invalid user Ethereum address");
    }

    const dataArray = new Uint8Array(packagedData);

    // Extract components
    let offset = 0;
    const iv = dataArray.slice(offset, offset + 12);
    offset += 12;
    const ownerIv = dataArray.slice(offset, offset + 12);
    offset += 12;
    const successorIv = dataArray.slice(offset, offset + 12);
    offset += 12;
    const encryptedKeyForOwner = dataArray.slice(offset, offset + 48);
    offset += 48;
    const encryptedKeyForSuccessor = dataArray.slice(offset, offset + 48);
    offset += 48;
    const encryptedData = dataArray.slice(offset);

    // Determine which key to use based on user's address
    const isOwner = userAddress.toLowerCase() === ownerAddress.toLowerCase();
    const isSuccessor =
      userAddress.toLowerCase() === successorAddress.toLowerCase();

    if (!isOwner && !isSuccessor) {
      throw new Error("You are not authorized to decrypt this file");
    }

    // Derive the user's decryption key
    const userKey = await deriveEncryptionKey(userAddress);

    // Decrypt the file key using the appropriate encrypted key and IV
    const encryptedKey = isOwner
      ? encryptedKeyForOwner
      : encryptedKeyForSuccessor;
    const keyIv = isOwner ? ownerIv : successorIv;

    const decryptedFileKey = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(keyIv) },
      userKey,
      encryptedKey,
    );

    // Import the decrypted file key
    const fileKey = await crypto.subtle.importKey(
      "raw",
      decryptedFileKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );

    // Decrypt the file
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      fileKey,
      encryptedData,
    );

    console.log("File decrypted successfully");
    return decryptedData;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error(
      "Failed to decrypt file. You may not be authorized to access this file.",
    );
  }
}

/**
 * Combines encrypted data and IV into a single blob for IPFS upload
 * Format: [IV (12 bytes)][Encrypted Data]
 */
export function packageEncryptedFile(
  encryptedData: ArrayBuffer,
  iv: Uint8Array,
): Blob {
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return new Blob([combined], { type: "application/octet-stream" });
}

/**
 * Extracts IV and encrypted data from a packaged file
 */
export function unpackageEncryptedFile(packagedData: ArrayBuffer): {
  iv: Uint8Array;
  encryptedData: ArrayBuffer;
} {
  const dataArray = new Uint8Array(packagedData);

  // Extract IV (first 12 bytes)
  const iv = dataArray.slice(0, 12);

  // Extract encrypted data (remaining bytes)
  const encryptedData = dataArray.slice(12).buffer;

  return { iv, encryptedData };
}

/**
 * EXAMPLE USAGE IN YOUR COMPONENT
 */

// ============================================
// ENCRYPTION FLOW (Owner creating inheritance)
// ============================================
// async function handleSubmitWithEncryption(event: React.FormEvent) {
//   event.preventDefault();
//   if (!selectedFile) return;
//
//   setUploading(true);
//
//   try {
//     // 1. Encrypt the file with successor's address
//     const { encryptedData, iv } = await encryptFile(
//       selectedFile,
//       successorWallet,
//     );
//
//     // 2. Package IV and encrypted data together
//     const packagedFile = packageEncryptedFile(encryptedData, iv);
//
//     // 3. Upload encrypted package to IPFS
//     const formData = new FormData();
//     formData.append("file", packagedFile, `${selectedFile.name}.encrypted`);
//
//     const response = await fetch("/api/upload-ipfs", {
//       method: "POST",
//       body: formData,
//     });
//
//     if (!response.ok) throw new Error("Upload failed");
//
//     const data = await response.json();
//
//     // 4. Store on blockchain
//     // const tx = await contract.createInheritance(
//     //   successorWallet,
//     //   data.hash,
//     //   selectedTag,
//     //   selectedFile.name,
//     //   selectedFile.size
//     // );
//     // await tx.wait();
//
//     // 5. Store metadata locally
//     const newAsset = {
//       successorWallet,
//       file: {
//         name: selectedFile.name,
//         size: selectedFile.size,
//         type: selectedFile.type,
//         lastModified: selectedFile.lastModified,
//       },
//       tag: selectedTag,
//       ipfsHash: data.hash,
//       ipfsUrl: data.url,
//       encrypted: true, // Flag to indicate encryption
//     };
//
//     setAssets((prev) => [...prev, newAsset]);
//     setShowSuccessModal(true);
//   } catch (error) {
//     console.error("Error:", error);
//     alert("Error: " + (error as Error).message);
//   } finally {
//     setUploading(false);
//   }
// }

// ============================================
// DECRYPTION FLOW (Successor claiming inheritance)
// ============================================
// async function downloadAndDecryptInheritance(
//   ipfsUrl: string,
//   userAddress: string,
// ) {
//   try {
//     // 1. Fetch encrypted file from IPFS
//     const response = await fetch(ipfsUrl);
//     if (!response.ok) throw new Error("Failed to fetch from IPFS");
//
//     const encryptedPackage = await response.arrayBuffer();
//
//     // 2. Unpackage to get IV and encrypted data
//     const { iv, encryptedData } = unpackageEncryptedFile(encryptedPackage);
//
//     // 3. Decrypt using user's address
//     const decryptedData = await decryptFile(encryptedData, iv, userAddress);
//
//     // 4. Create downloadable blob
//     const blob = new Blob([decryptedData], { type: "application/pdf" });
//     const url = URL.createObjectURL(blob);
//
//     // 5. Trigger download
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "inheritance-document.pdf";
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//
//     console.log("File decrypted and downloaded successfully");
//   } catch (error) {
//     console.error("Decryption failed:", error);
//     alert("Failed to decrypt file. You may not be the authorized successor.");
//   }
// }

// ============================================
// VERIFICATION HELPER
// ============================================
/**
 * Verify that user can decrypt an inheritance
 * Useful for checking access before attempting full decryption
 */
export async function verifyDecryptionAccess(
  successorAddress: string,
  userAddress: string,
): Promise<boolean> {
  return successorAddress.toLowerCase() === userAddress.toLowerCase();
}
