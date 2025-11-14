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

# Heritage Inheritance Protocol

_A tool for securely passing cultural assets or secret knowledge across generations._

---

# Project Title

**Heritage Inheritance Protocol**

Short concept: A tool that allows people who wish to preserve cultural assets or secret knowledge to securely and permanently pass them down to others across generations.

---

### Repository / MVP / DEMO

- **Repository:** https://github.com/Heirloom-Inheritance-Protocol
- **MVP page:** https://heirloom-inheritance-protocol.vercel.app/
- **Deck / Presentation:** https://docs.google.com/presentation/d/1HbvQ5WrT1ixoNJFvNQ_snX9PHyXFh6y4JEpv3stpHbs/edit?usp=sharing

---
# Team

**Team/Individual Name:**

- Keita Kuroiwa, Dario Macs

**GitHub Handles:**

- cruujon, DaroMacs

**Devfolio Handles:**

- cruujon, daro_macs

---

# Project Description

## Problem / Motivation

Currently, those who want to pass down their knowledge or skills have no choice but to share secret information directly — either orally or on paper.  
There is no verifiable way to record _who passed it to whom_, which makes extinction of such knowledge a real risk.

Traditional craftsmanship is disappearing globally not only because knowledge is lost, but because the act of transmission is invisible to institutions and future generations.  
Anchoring these successions on-chain — with auditable records and public funding mechanisms — makes cultural inheritance _visible_ and _preservable_.

Additional risks:

- Even though such cultural assets are meaningful and important to preserve, it is often unclear who contributed to their preservation.
- Historically sensitive knowledge is vulnerable to censorship by institutions or governments. Oral traditions can be altered, sanitized, or erased.

## Solution

- Record _who (wallet)_ passed knowledge to _whom (wallet)_ on-chain, preserving lineage and provenance.
- Encrypt content **client-side** so the knowledge itself remains private.
- Store encrypted data on IPFS; only its hash (CID) is referenced on-chain.
- Only the designated successor's wallet can derive the correct key to decrypt the content.
- This enables preservation of private cultural assets without forcing public disclosure.

## Target Users

- Individuals wanting to pass down secret or valuable knowledge _privately_.
- Examples:
  - A restaurant owner with a secret recipe but no successor.
  - Craftsmen with unique techniques that cannot be publicized.
  - Oral storytelling traditions and local cultural narratives.

---

# Key Features

- **Client-side encrypted inheritance**

  - The owner selects a PDF and a successor wallet address.
  - File is encrypted entirely in the browser using **AES-256-GCM**.
  - The AES key is derived from the successor’s Ethereum address via **PBKDF2 (100,000 iterations)**.

- **Successor-only decryption**

  - Only the wallet that matches the successor address can regenerate the AES key.

- **IPFS-based decentralized storage**

  - Only encrypted blobs are uploaded.
  - Blob format: `[IV (12 bytes)][Encrypted Data]`.

- **On-chain lineage**

  - Immutable record of: owner → successor, `ipfsHash`, `fileName`, `fileSize`, `timestamp`, and status flags.
  - Creates verifiable historical context for each inheritance.

- **End-to-end flow**
  - Originator: encrypt → upload → register on-chain
  - Successor: verify → fetch → decrypt → download

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

## Inheritance Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        INHERITANCE FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1️⃣  OWNER CREATES INHERITANCE
   ┌──────────────┐
   │ Select PDF   │
   │ + Successor  │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────┐
   │ ENCRYPT CLIENT-SIDE     │
   │ • Use successor address │
   │ • AES-256-GCM           │
   │ • Generate random IV    │
   └──────┬──────────────────┘
          │
          ▼
   ┌─────────────────────────┐
   │ UPLOAD TO IPFS          │
   │ • Encrypted file only   │
   │ • Returns IPFS hash     │
   └──────┬──────────────────┘
          │
          ▼
   ┌─────────────────────────┐
   │ STORE ON BLOCKCHAIN     │
   │ • IPFS hash             │
   │ • Successor address     │
   │ • Metadata              │
   └─────────────────────────┘

2️⃣  SUCCESSOR CLAIMS INHERITANCE
   ┌──────────────────────────┐
   │ Connect Wallet           │
   │ (Must be successor)      │
   └──────┬───────────────────┘
          │
          ▼
   ┌─────────────────────────┐
   │ VERIFY ON BLOCKCHAIN    │
   │ • Check successor match │
   │ • Verify not claimed    │
   └──────┬──────────────────┘
          │
          ▼
   ┌─────────────────────────┐
   │ FETCH FROM IPFS         │
   │ • Download encrypted    │
   │ • Extract IV + data     │
   └──────┬──────────────────┘
          │
          ▼
   ┌─────────────────────────┐
   │ DECRYPT CLIENT-SIDE     │
   │ • Use their address     │
   │ • Decrypt with key      │
   │ • Download PDF          │
   └─────────────────────────┘
```

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
- No keys stored on-chain, off-chain, or in IPFS.
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

# Contract Addresses

- Contract: Inheritance
- Address: (fill after deployment)
- Network: Arbitrum Sepolia

---

# Demo

**Main Repository Link**  
https://github.com/Heirloom-Inheritance-Protocol

**Demo / Deployment Link**  
https://heirloom-inheritance-protocol.vercel.app/

**Deck / Presentation**  
https://docs.google.com/presentation/d/1HbvQ5WrT1ixoNJFvNQ_snX9PHyXFh6y4JEpv3stpHbs/edit?usp=sharing

---

# Objectives

By the end of ARG25, the following core objectives were achieved:

- Record at least one _inheritance event_ (owner → successor) on-chain and show the transaction hash.
- Successfully upload an encrypted file to IPFS and store only the CID on-chain.
- Ensure that only the designated successor wallet can decrypt the encrypted file.
- Provide a clear UI workflow:  
  “inheritance created → inheritance claimable by successor → inheritance claimed → decrypted.”

---

# Weekly Progress

## Week 1 (ends Oct 31)

**Goals:**  
Team formation and early ideation.

**Progress Summary:**  
Teamed up with @DaroMacs and @masaun.  
Explored initial product directions and cultural preservation use cases.

---

## Week 2 (ends Nov 7)

**Goals:**  
Finalize the core architecture, define encryption and storage flows, and choose the tech stack.

**Progress Summary:**

### Frontend MVP

- Scaffolded a Next.js + Wagmi + viem application.
- Integrated wallet connection and basic transaction handling.
- Built initial UI for uploading PDFs and showing inheritance lineage.
- Implemented placeholder IPFS integration to simulate CID workflows.

### Documentation

- Added system architecture diagrams to `/docs/ARCHITECTURE.md`.
- Updated README with contract address placeholders, stack overview, and usage instructions.

### Tech Stack Overview

- **Blockchain:** Arbitrum Sepolia
- **Smart Contracts:** Solidity
- **Frontend:** Next.js 14, TypeScript, Wagmi, viem, shadcn/ui
- **Storage:** IPFS (CID-based retrieval)
- **Tooling:** pnpm, dotenv, eslint/prettier

### System Architecture (MVP)

Validated the integration model:

- Client-side AES encryption
- IPFS upload via API route or client
- On-chain metadata
- Successor-only decryption

---

## Week 3 (ends Nov 14)

**Goals:**  
Complete the MVP development and deploy all components.

**Progress Summary:**

- Smart contract deployed to Arbitrum Sepolia.
- IPFS integration with actual encrypted blobs is live.
- Full end-to-end inheritance flow implemented:
  encrypt → upload → register → claim → decrypt.
- Users can now experience the full MVP on the live deployment.

# Next Steps (After Invisible Garden)

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

---

# Final Wrap-Up

### Deliverables

- Fully functional MVP
- On-chain contract
- Live frontend with complete user flows
- Encrypted inheritance mechanism
- Lineage visibility and basic UI

### Technical Outcomes

- Verified viability of client-side AES-256-GCM encryption + PBKDF2 key derivation tied to successor wallet address.
- Implemented a minimal yet secure pipeline combining IPFS, Ethereum smart contracts, and browser crypto.
- Identified areas for improvement (key rotation, ECDH upgrade, multi-layered permissions).

### Repository / MVP / DEMO

- **Repository:** https://github.com/Heirloom-Inheritance-Protocol
- **MVP page:** https://heirloom-inheritance-protocol.vercel.app/
- **Deck / Presentation:** https://docs.google.com/presentation/d/1HbvQ5WrT1ixoNJFvNQ_snX9PHyXFh6y4JEpv3stpHbs/edit?usp=sharing

---

# Learnings

During ARG25, we deepened our understanding of:

- Core Arbitrum Stylus concepts from the lecture series, including how Rust-based contracts interact with the Arbitrum toolchain.
- Security best practices around client-side encryption, emphasizing key derivation, storage minimization, and safe handling of encrypted payloads.
- Designing IPFS upload flows that keep the encrypted data decoupled from on-chain references while preserving traceability.
- Structuring inheritance journeys in the UI so wallet interactions, encryption steps, and status updates remain transparent to non-technical users.
- Coordinating smart contract events with frontend state to build reliable lineage timelines across deployments and testnets.

---
