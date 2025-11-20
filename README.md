# Ramen Protocol

A decentralized protocol for preserving and passing down cultural assets and secret knowledge across generations with privacy, verifiability, and censorship-resistance.

---

## 🎯 Overview

Ramen Protocol enables individuals to securely inherit sensitive knowledge to chosen successors while maintaining privacy through encryption and creating permanent, verifiable records of cultural lineage on-chain.

---

## 📺 Important Links

- **Demo Video:** https://www.loom.com/share/08768e78bc7a4594a6a216b6ed8dac7d
- **Deck / Presentation:** https://docs.google.com/presentation/d/1dZ1V8BSY7JjxjKgjzIl1uxYEoeBCLIvdFmhdvrNZLak/edit?usp=sharing
- **Main Contract:** [zkheriloom3.sol](src/contract/zkheriloom3.sol)
- **Relayer:** [relayer/](relayer/)

---

## 👥 Team

- **cruujon** (Keita Kuroiwa) - [@cruujon](https://github.com/cruujon)
- **Dario Macs** - [@DaroMacs](https://github.com/DaroMacs)
- **Ariel** - [@ariiellus](https://github.com/ariiellus)

---

## 🔍 The Problem

Human knowledge and culture depend on inheritance—skills, wisdom, and traditions passed across generations. Yet today, there's no secure, privacy-preserving method to:

- Pass down sensitive knowledge to a chosen successor
- Make inheritance relationships visible and verifiable
- Create permanent, traceable records of cultural lineage

### Core Issues

**🔒 Invisible & Unverifiable Relationships**

No reliable way exists to document who passed what to whom. Contributions go unrecognized, unrewarded, and untracked—making knowledge transmission structurally fragile.

**⚖️ Privacy vs. Verifiability Trade-off**

Current systems force users to choose between proving contribution, keeping content private, or ensuring censorship-resistance. True secret knowledge sharing requires compromising on at least one dimension.

**🎯 Missing Incentives**

When efforts leave no trace or recognition, motivation declines. Invisible transmission leads to disengagement, accelerating cultural loss.

**🏛️ No Support for True Inheritors**

Without verifiable lineage records, preservation organizations cannot identify, support, or fund the people truly maintaining cultural continuity. This leaves traditions vulnerable to distortion or erasure.

---

## ✨ The Solution

Ramen Protocol creates a privacy-preserving, verifiable inheritance system by combining:

- **On-chain lineage tracking:** Records who (wallet address) passed knowledge to whom, creating immutable provenance
- **Client-side encryption:** Files encrypted in-browser before upload using AES-256-GCM
- **Successor-only decryption:** Only the designated successor's wallet can derive the decryption key
- **Decentralized storage:** Encrypted data stored on IPFS/Arkiv; only the hash (CID) recorded on-chain
- **Fair revenue distribution:** Visible inheritance chains enable proportional compensation based on contribution lineage

---

## 🎭 Target Users

**Primary Use Cases:**

**🍜 Restaurant Owners**
Preserve secret recipes without public disclosure while ensuring they pass to the right successor.

**🎨 Master Craftspeople**
Document unique techniques that cannot be publicized but need preservation.

**📖 Oral Tradition Keepers**
Record storytelling traditions and local cultural narratives with verifiable lineage.

**💼 Knowledge Professionals**
Pass down proprietary methods, investment strategies, or specialized expertise privately.

---

## 🔑 Key Features

### ZK-Enhanced Privacy

- Users select a file and successor wallet address
- Files encrypted entirely in-browser using **AES-256-GCM**
- Integration with **Semaphore Protocol** for zero-knowledge proof verification
- Only the designated successor can decrypt the content

### Decentralized Storage

- **IPFS:** Stores encrypted files
- **Arkiv:** Maintains merkle tree commitments and IPFS CIDs for data integrity
- Only content hashes (CIDs) are stored on-chain

### On-chain Lineage Tracking

- Immutable records: owner → successor, IPFS hash, file metadata, timestamps
- Parent-child inheritance relationships tracked
- Generation levels recorded for full historical context
- Creates verifiable cultural lineage

---

## 🏗️ Architecture Overview

### System Components

**Frontend (Next.js + Privy + viem)**
- File encryption/decryption (Web Crypto API)
- IPFS upload/download
- Smart contract interactions
- Inheritance lineage visualization
- Wallet authentication via Privy

**Smart Contracts (Scroll Sepolia / Solidity)**
- [zkheriloom3.sol](src/contract/zkheriloom3.sol) - Main inheritance contract
- Integration with Semaphore Protocol for ZK proofs
- Stores inheritance metadata
- Manages vault creation and member verification
- Tracks lineage relationships

**Relayer Service (Node.js + Express)**
- Facilitates Semaphore Protocol interactions
- Manages commitment hashes for privacy preservation
- Handles merkle tree operations

**Storage Layer**
- **IPFS:** Encrypted file storage
- **Arkiv:** Merkle tree data and IPFS CID records

### Architecture Diagram

```
User → Frontend (Next.js) → Smart Contract (zkheriloom3) → Semaphore Protocol
                    ↓                                            ↓
                  IPFS                                       Relayer
                    ↓                                            ↓
                  Arkiv  ←──────────────────────────────────────┘
```

**Core Flow:**

1. User creates a new vault to store information in IPFS
2. User provides a "secret" (word, phrase, key, etc.)
3. Interaction occurs via zkheriloom3 contract using a relayer to connect to Semaphore
4. Semaphore stores commitment hashes to preserve privacy via Incremental Merkle Trees
5. All merkle tree data and IPFS CIDs are stored in Arkiv for proper IMT reconstruction

---



## 📖 User Flows

### 1. Creating an Inheritance (Originator)

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

### 2. Receiving an Inheritance (Successor)

<img width="1063" height="894" alt="image" src="https://github.com/user-attachments/assets/8daa2466-e67e-41a6-a616-7ccb6ad166ad" />

**2-0. Connect Wallet**  
The chosen successor connects using the **same wallet address** registered by the originator.

**2-1. View Received Metadata in the "Received / Vaults" tab**  
Once connected, the successor can open the **Received / Vaults** section to view metadata for all inheritance entries sent to them.

**2-2. Download & Decrypt**  
Click **Download (DL)**.  
The encrypted file is fetched and automatically decrypted locally, then saved safely to the successor’s device.

---

### 3. Verifying and Evaluating Inheritances in Graph View

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

---

## 📁 Project Structure

```
ramen-protocol/
├── src/
│   ├── app/                    # Next.js app pages
│   │   ├── dashboard/          # Inheritance lineage visualization
│   │   ├── inherit/            # Create inheritance page
│   │   ├── received-vault/     # View received inheritances
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   ├── ui/                 # UI components (shadcn/ui)
│   │   └── CreateGroup.tsx     # Vault creation component
│   ├── contract/               # Smart contracts
│   │   ├── zkheriloom3.sol     # Main inheritance contract
│   │   └── script/             # Deployment scripts
│   ├── context/                # React context providers
│   ├── lib/                    # Utility libraries
│   ├── providers/              # App-wide providers (Privy, etc.)
│   └── services/               # Business logic services
├── relayer/                    # Relayer service
│   ├── index.js                # Express server
│   ├── routes/                 # API routes
│   ├── utils/                  # Utility functions
│   └── config/                 # Configuration files
├── lib/                        # External dependencies
│   ├── forge-std/              # Foundry standard library
│   └── semaphore/              # Semaphore Protocol
├── foundry.toml                # Foundry configuration
├── package.json                # Frontend dependencies
└── README.md
```

---

## 🔐 Encryption & Decryption Flow

### 1. Owner (Originator)

1. Select PDF + successor wallet address.
2. Derive AES key with PBKDF2(successorAddress, 100k iterations).
3. Encrypt file using AES-256-GCM (with random 12-byte IV).
4. Create blob: `[IV][ciphertext]`.
5. Upload encrypted blob to IPFS via API route or client-side upload.
6. Call `createInheritance(successor, ipfsHash, tag, fileName, fileSize)`.

### 2. Successor (Receiver)

1. Connect wallet.
2. Contract verifies:
   - caller == successor
   - inheritance is active & unclaimed
3. Fetch encrypted blob from IPFS.
4. Derive AES key from successor’s address (PBKDF2).
5. Decrypt and download PDF.
6. Optionally call `claimInheritance(id)` to mark as received.

---

## 🔒 Security Properties

- Files are encrypted **before upload** (E2E).
- Only successor wallet can derive the correct key.
- No keys stored on-chain, off-chain, or in ARKIV.
- IPFS blobs are public but unreadable.
- On-chain lineage is tamper-proof.

**Security Limitations:**

- If successor wallet is compromised, the encrypted file can be decrypted.
- No key rotation mechanism yet.
- Browser-based crypto requires trustworthy hosting.

---

## 🛠️ Tech Stack

### Blockchain & Smart Contracts
- **Network:** Scroll Sepolia
- **Smart Contracts:** Solidity 0.8.30
- **Development Framework:** Foundry
- **ZK Protocol:** Semaphore Protocol v4.14.0

### Frontend
- **Framework:** Next.js 16 + React 19
- **Language:** TypeScript
- **Web3 Integration:** viem v2.39+
- **Authentication:** Privy v3.6+
- **UI Components:** shadcn/ui + Tailwind CSS 4
- **Animations:** Framer Motion

### Storage & Infrastructure
- **Decentralized Storage:** IPFS + Arkiv Network SDK
- **Encryption:** Web Crypto API (AES-256-GCM, PBKDF2)

### Backend Services
- **Relayer:** Node.js + Express
- **API Framework:** Express.js with CORS
- **Blockchain Library:** ethers.js v6

### Development Tools
- **Package Manager:** pnpm 10+
- **Linting:** ESLint
- **Environment Management:** dotenv

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Foundry (for smart contract development)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Heirloom-Inheritance-Protocol/ethereum-heritage-inheritance-protocol.git
cd ethereum-heritage-inheritance-protocol
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run the development server**
```bash
pnpm dev
```

5. **Run the relayer (in a separate terminal)**
```bash
cd relayer
npm install
npm run dev
```

### Smart Contract Development

```bash
# Compile contracts
forge build

# Run tests
forge test

# Deploy contracts
forge script src/contract/script/zkheriloom3.s.sol --rpc-url scroll_sepolia --broadcast
```

---

## 🗺️ Roadmap

### Short Term

- ✅ Deploy to Scroll Sepolia testnet
- 🔄 Mainnet deployment across multiple L2s (Scroll, Arbitrum, Base)
- 🔄 Upgrade encryption model (PBKDF2 → ECDH-based key agreement)
- 🔄 Integrate with Ethereum Attestation Service (EAS) for permissionless lineage reuse

### Medium Term

**AI Integration**
- Automatically estimate cultural/economic importance scores for inheritances
- Auto-tag inherited data for improved discoverability
- Algorithmic matching of inheritors and successors

**Funding Mechanisms**
- Integrate Gitcoin stack for donation and grant-based preservation funding
- Run dedicated funding rounds for cultural asset preservation
- Collaborate with local governments and cultural institutions for real-world deployments

### Long Term

- Multi-chain inheritance tracking and verification
- Enhanced ZK proof mechanisms for stronger privacy guarantees
- DAO governance for protocol upgrades and treasury management
- Mobile app for broader accessibility

---

## 📄 License

MIT License - see the LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Contact

- **GitHub:** [Heirloom-Inheritance-Protocol](https://github.com/Heirloom-Inheritance-Protocol)
- **Demo:** [Video Presentation](https://www.loom.com/share/08768e78bc7a4594a6a216b6ed8dac7d)

---

## 🙏 Acknowledgments

- [Semaphore Protocol](https://github.com/semaphore-protocol/semaphore) - Zero-knowledge proof framework
- [Arkiv Network](https://arkiv.network) - Decentralized data storage
- [Scroll](https://scroll.io) - zkEVM Layer 2 network
- [Privy](https://privy.io) - Wallet authentication
- [shadcn/ui](https://ui.shadcn.com) - UI component library

---

Built with ❤️ for preserving human knowledge and cultural heritage across generations.
