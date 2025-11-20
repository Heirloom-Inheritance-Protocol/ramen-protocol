# Secret-Knowledge-Inheritance-Protocol

Short concept: A tool that allows people who wish to preserve cultural assets or secret knowledge to securely and permanently pass them down to others across generations.

---

### Repository / MVP / DEMO / Deck

- **Presentation Video:**　https://www.loom.com/share/08768e78bc7a4594a6a216b6ed8dac7d

- **Deck / Presentation:** https://docs.google.com/presentation/d/1dZ1V8BSY7JjxjKgjzIl1uxYEoeBCLIvdFmhdvrNZLak/edit?usp=sharing

---

# Team

**Team/Individual Name:**

- cruujon(Keita Kuroiwa), Dario Macs, Ariel

**GitHub Handles:**

- cruujon, DaroMacs, ariiellus

---

# Project Description

### Problem

Human knowledge and culture are built on inheritance — skills, wisdom, and traditions passed from one person to another across generations.
Yet despite their value, there is still no secure, privacy-preserving way to pass down sensitive or secret knowledge to a chosen successor, nor any method to make these inheritance relationships visible, verifiable, and permanently traceable.

Most transmissions leave no record of “who passed what to whom.”
This structural invisibility makes preservation impossible, and countless oral traditions, craft techniques, and region-specific knowledge systems continue to disappear at an accelerating pace.

### Causes

1. Inheritance relationships are invisible and unverifiable.

There is no reliable way to document who passed what to whom.
As a result, contributions cannot be recognised, rewarded, or tracked across generations — making knowledge transmission structurally fragile.

2. Privacy, verifiability, and censorship-resistance cannot coexist today.

There are almost no systems that allow someone to:
prove they contributed to preserving knowledge, keep the content private, and ensure censorship-resistance, all at the same time.
Sharing valuable secret knowledge and protecting one’s own privacy often becomes a trade-off, forcing knowledge holders to compromise on one or the other.

3. Knowledge holders lack incentives to pass down what they know.

When their efforts leave no trace and no recognition, motivation declines.
Invisible transmission leads to disengagement — and disengagement accelerates cultural loss.

4. Preservation organisations and future generations cannot identify true inheritors.

Without verifiable lineage records, institutions cannot support or fund the people truly maintaining cultural continuity.
This also leaves traditions vulnerable to distortion or erasure by intermediaries or authorities, with no authoritative source to reference.

## Solution

- Record _who (wallet)_ passed knowledge to _whom (wallet)_ on-chain, preserving lineage and provenance.
- using ZK & client-side Encryption\* so the knowledge itself remains private.
- Store encrypted data on IPFS/Arkiv; only its hash (CID) is referenced on-chain.
- Only the qualified/designated successor's wallet can derive the correct key to decrypt the content.
- This enables preservation of private knowledge without forcing public disclosure.
- make the inheritance & lineage & visible so that the revenue from the knowledge is fairly distributed according to each dependency

## Target Users

- Individuals wanting to pass down secret & valuable knowledge privately.
- Examples:
  - A restaurant owner with a secret recipe but no successor.
  - Craftsmen with unique techniques that cannot be publicised.
  - Oral storytelling traditions and local cultural narratives.
  - A trader who has secret investment knowledge and a unique method

---

# Key Features

- **ZK inheritance**

  - The owner selects a PDF and a successor wallet address.
  - File is encrypted entirely in the browser using **AES-256-GCM**.
  - The AES key is derived from the successor’s Ethereum address via **PBKDF2 (100,000 iterations)**.

- **Successor-only decryption**

  - Only the wallet that matches the successor address can regenerate the AES key.

- **Arkiv & IPFS-based decentralized storage**

  - for strage of data, we use Arkiv and IPFS

- **On-chain lineage**

  - Immutable record of: owner → successor, `ipfsHash`, `fileName`, `fileSize`, `timestamp`, and status flags.
  - Creates verifiable historical context for each inheritance.

---

# Architecture Overview

## System Components

- **Frontend (Next.js + Wagmi + viem)**  
  Handles:

  - file encryption/decryption (Web Crypto API)
  - IPFS upload/download (via API route or direct)
  - contract calls
  - lineage display

- **Blockchain (Arbitrum Sepolia / Solidity)**  
  Responsible for:

  - storing inheritance metadata
  - verifying successor identity (`msg.sender`)
  - preserving lineage

- **Storage: IPFS**
  - Stores encrypted blobs only.
  - Contract stores the `ipfsHash` as reference.

  

---



# Core User Flow

## 1. Creating an Inheritance (Originator)

<img width="814" height="780" alt="image" src="https://github.com/user-attachments/assets/37d357ec-621d-46ea-9807-c7f92191c971" />

**1-0. Connect Wallet**  
Connect your wallet to the app.  
Non-crypto users can also generate a wallet easily using just an email address.

**1-1. Prepare the Knowledge Asset**  
The originator prepares the secret or culturally valuable information they wish to pass down — such as a recipe, a craft technique, or any sensitive document — in **PDF format**.

**1-2. Set the Successor Wallet in the "Inherit" tab**  
At the **Successor Wallet** field in the Inherit section tab, enter the wallet address of the person who will inherit the information.

**1-3. Upload the PDF**  
Click **Upload PDF** and select the file you want to inherit.

**1-4. Choose a Tag Type**  
Select a relevant tag such as _Recipe_, _Cultural Heritage_, _Finance_, etc.  
(These tags allow efficient querying and classification in the database.)

**1-5. Create Inheritance**  
Click **Create Inheritance**.  
Your wallet will request a signature. Once signed, the file is **encrypted client-side** and safely uploaded to **IPFS**.

**1-6. Access via Vaults**  
Uploaded inheritance entries can always be accessed and searched under the **Vaults** tab.

---

## 2. Receiving an Inheritance (Successor)

<img width="1063" height="894" alt="image" src="https://github.com/user-attachments/assets/8daa2466-e67e-41a6-a616-7ccb6ad166ad" />

**2-0. Connect Wallet**  
The chosen successor connects using the **same wallet address** registered by the originator.

**2-1. View Received Metadata in the "Received / Vaults" tab**  
Once connected, the successor can open the **Received / Vaults** section to view metadata for all inheritance entries sent to them.

**2-2. Download & Decrypt**  
Click **Download (DL)**.  
The encrypted file is fetched and automatically decrypted locally, then saved safely to the successor’s device.

---

## 3. Verifying and Evaluating Inheritances in Graph View in the "Dashboard" tab

<img width="869" height="819" alt="image" src="https://github.com/user-attachments/assets/36022cca-c05a-4920-8a24-52a8b5cc2220" />

**3-1. Visual Lineage Graph**  
All contributors in an inheritance chain — originators, successors, and cultural organizations curating heritage — can visually review each succession event.  
The dashboard presents a **graph of parent–child inheritance relationships**, showing how knowledge has been passed across generations.

Additional insights include:

- Automatic counting of total contributors in each inheritance chain
- Easy identification of branching cultural lineages
- High-level visibility into how cultural assets evolve

Example external stakeholders who may access the graph view:  
_Local governments, museums, cultural preservation NGOs, public goods organizations_

**3-2. Evidence for Public Goods Funding and Access Control**  
External organizations can use the verifiable on-chain proof of inheritance to:

- Evaluate cultural preservation contributions
- Use inheritance lineage as **evidence** in public-goods or grant-funding processes
- Apply **gating criteria** (e.g., only contributors of a specific inheritance chain can access a program, benefit, or grant)

This ensures that historical knowledge is preserved with integrity and that contributors receive recognition and opportunities aligned with their cultural work.

## Folder Structure

```
.
|-- README.md
|-- frontend
|   |-- README.md
|   |-- components.json
|   |-- eslint.config.mjs
|   |-- next-env.d.ts
|   |-- next.config.ts
|   |-- package-lock.json
|   |-- package.json
|   |-- postcss.config.mjs
|   |-- public
|   |   |-- file.svg
|   |   |-- globe.svg
|   |   |-- heritage-tr.png
|   |   |-- heritage.png
|   |   |-- next.svg
|   |   |-- vercel.svg
|   |   `-- window.svg
|   |-- src
|   |   |-- app
|   |   |-- components
|   |   |-- lib
|   |   `-- providers
|   `-- tsconfig.json
`-- stylus
    |-- Cargo.lock
    |-- Cargo.toml
    |-- README.md
    |-- header.png
    |-- licenses
    |   |-- Apache-2.0
    |   |-- COPYRIGHT.md
    |   |-- DCO.txt
    |   `-- MIT
    |-- rust-toolchain.toml
    `-- src
        |-- lib.rs
        `-- main.rs
```

# Encryption & Decryption Flow (MVP)

## 1. Owner (Originator)

1. Select PDF + successor wallet address.
2. Derive AES key with PBKDF2(successorAddress, 100k iterations).
3. Encrypt file using AES-256-GCM (with random 12-byte IV).
4. Create blob: `[IV][ciphertext]`.
5. Upload encrypted blob to IPFS via API route or client-side upload.
6. Call `createInheritance(successor, ipfsHash, tag, fileName, fileSize)`.

## 2. Successor (Receiver)

1. Connect wallet.
2. Contract verifies:
   - caller == successor
   - inheritance is active & unclaimed
3. Fetch encrypted blob from IPFS.
4. Derive AES key from successor’s address (PBKDF2).
5. Decrypt and download PDF.
6. Optionally call `claimInheritance(id)` to mark as received.

---

# Security Properties (MVP)

- Files are encrypted **before upload** (E2E).
- Only successor wallet can derive the correct key.
- No keys stored on-chain, off-chain, or in ARKIV.
- IPFS blobs are public but unreadable.
- On-chain lineage is tamper-proof.

Security limitations:

- If successor wallet is compromised, the encrypted file can be decrypted.
- No key rotation mechanism yet.
- Browser-based crypto requires trustworthy hosting.

---

# Tech Stack

- **Blockchain:** Arbitrum Sepolia
- **Smart Contracts:** Solidity
- **Frontend:** Next.js 14, TypeScript, Wagmi, viem, shadcn/ui
- **Storage:** IPFS
- **Crypto:** Web Crypto API (AES-256-GCM, PBKDF2)
- **Tooling:** pnpm, dotenv, eslint/prettier

---


# Next Steps

## Short Term

- Deploy to mainnet and expand across multiple L2s.
- Upgrade encryption model (e.g., migrate from PBKDF2 → ECDH-based key agreement).
- Integrate with EAS so other protocols can reuse inheritance lineage permissionlessly.

## Medium Term

- **AI Integration**

  - Automatically estimate cultural/economic importance scores for each inheritance.
  - Auto-tag inherited data for better discoverability.
  - Match inheritors and successors algorithmically.

- **Funding Mechanisms**
  - Integrate Gitcoin stack for donation and grant-based preservation funding.
  - Run funding rounds for cultural assets.
  - Collaborate with local governments and cultural institutions to test real-world deployments.

---
