# Heirloom Inheritance Protocol — MVP Build Doc latest ver.

##  Folder Structure

```
arg25-projects/
|
├── README.md # You are here (program overview)
├── README_template.md # Base template for your project README
|
├── your-project/
|   |   ├── README.md # Your project progress log
|   |   └── assets/ # (optional) diagrams, screenshots, etc.
|   └── ...
|
└── 
```



## 0) One-line Purpose

Build a **minimal product** that makes *who passed which secret to whom* verifiable on-chain, while keeping the **actual content encrypted** so that **only the giver and the successor** can read it at each hand-off.

- Public: lineage (`from → to`), content hash/commitment, timestamps
- Private: the content itself (files/text), decryption keys

---

## 1) Design Principles

1. **Separation of concerns**
    - On-chain → verifiable **facts** (registration, inheritance, timestamps)
    - Off-chain → **encrypted content** storage (IPFS)
    - Client → **key generation, encryption/decryption, bundle creation**
2. **Minimal dependencies (hackathon-friendly)**
    - Next.js + wagmi + Web Crypto + IPFS; no mandatory messaging layer
3. **Interoperable evidence**
    - EAS attestations for **tagging the inheritance type** and enabling **cross-protocol / external** references

---

## 2) System Overview (in words)

- **Frontend (Next.js 14 + TypeScript)**
    
    Wallet connect (RainbowKit / wagmi + viem), client-side crypto (Web Crypto + libsodium), IPFS client, QR/download payload hand-off, lineage view.
    
- **On-chain (Arbitrum Stylus / Rust, required)**
    
    `Registry` contract with `register_secret` and `inherit` functions; emits `SecretRegistered` and `Inherited` events.
    
- **Storage (IPFS)**
    
    Stores **ciphertext** only; on-chain stores `cidHash = keccak256(cid)`.
    
- **Evidence / Tags (EAS, recommended)**
    
    Attestations record **what type of inheritance** and **who → who** as machine-readable claims (with optional privacy via commitments).
    

---

## 3) Tech Stack and Roles

### 3.1 Chain Layer (required)

- **Arbitrum Stylus (Rust/WASM via `stylus-sdk`)**
    - Role: permanent public record of inheritance events
    - Minimal API:
        - `register_secret(cid_hash, meta) -> secret_id`
        - `inherit(secret_id, to)`
        - Events:
            - `SecretRegistered(secretId, owner, cidHash, time)`
            - `Inherited(secretId, from, to, time)`
    - Rationale: satisfies Stylus requirement; small surface area → fast to build, easy to demo.

### 3.2 Frontend Layer (required)

- **Next.js 14 (App Router) + TypeScript**
- **wagmi v2 + viem + RainbowKit** (wallet UX on Arbitrum testnet)
- **Crypto**: Web Crypto API + **libsodium.js**
    - Content encryption: **AES-GCM (256)** → produces `ciphertext`
    - Key wrapping per receiver: **X25519 (ECDH)** → derive KEK → wrap CEK with AES-GCM
- **IPFS HTTP client** (e.g., web3.storage, Pinata)
- **QR/file hand-off** for the signed payload bundle

### 3.3 Storage (required)

- **IPFS** for encrypted content (ciphertext)
- On-chain stores `cidHash` only (integrity reference)

### 3.4 Evidence & Tags (recommended)

- **Ethereum Attestation Service (EAS)** to publish an **Inheritance attestation** (type tags, references), enabling external protocols/organizations to query by **UID**.
- so that other funding protocol could refer the inheritance data, and fund them  depending upon dependency of each inheritance.

---

## 4) Data Model (minimal)

### 4.1 On-chain (Stylus events)

- `SecretRegistered(secretId, owner, cidHash, time)`
- `Inherited(secretId, from, to, time)`

### 4.2 Off-chain content and bundle

- **Ciphertext**: result of `AES-GCM(CEK, plaintext)` with a unique IV
- **Handoff bundle** (QR / download file) — signed by the originator:

```jsx
{
  "version": "1",
  "secretId": 123,
  "cid": "bafy... (IPFS CID)",
  "cidHash": "0x...",
  "wrapOriginator": "base64",   // CEK wrapped for the giver
  "wrapSuccessor": "base64",    // CEK wrapped for the successor
  "originatorWallet": "0xA...",
  "successorWallet": "0xB...",
  "originatorEncPub": "base64", // X25519 pubkey bound to wallet signature
  "successorEncPub": "base64",
  "originatorSignature": "0x...", // wallet signature over the canonicalized bundle
  "createdAt": 1712345678
}
```

### 4.3 EAS schema (tags + interoperability)

- **Schema name**: `Inheritance_v1`
- **Fields**:
    - `secretId: uint256`
    - `inheritanceType: bytes32` // e.g., keccak256("recipe"), "technique", "manuscript", "market-knowhow"
    - `from: address`
    - `to: address` or `toCommitment: bytes32` // use commitment for privacy: keccak256(to, salt)
    - `cidHash: bytes32`
    - `prevUID: bytes32` // links the previous inheritance attestation to form a lineage
    - `noteHash: bytes32` (optional)
- **Revocable / expiration** as needed
- **Privacy modes**:
    - Public → include `to` directly
    - Semi-private → include `toCommitment`, successor reveals later with salt

---

## 5) User Flow (MVP, demo-centric)

### 5.1 Register a Secret (Originator)

1. **Encrypt**: generate `CEK (AES-GCM 256)`, then `ciphertext = Encrypt(CEK, plaintext)`
2. **Store**: upload `ciphertext` to IPFS → get `cid`; compute `cidHash = keccak256(cid)`
3. **Commit**: call Stylus `register_secret(cid_hash)` → event `SecretRegistered(...)` (show Tx hash in UI)

### 5.2 Inherit (Originator → Successor)

1. **Wrap CEK for both parties**:
    - `wrapOriginator` using originator’s X25519 pubkey
    - `wrapSuccessor` using successor’s X25519 pubkey
2. **Bundle**: create the signed payload (above) and present as **QR / file download**
3. **Record lineage**: call Stylus `inherit(secret_id, to)` → `Inherited(...)` event
4. **(Recommended) EAS attestation**: issue `Inheritance_v1` with type tag and `prevUID` link

### 5.3 Receive & Decrypt (Successor)

1. **Import**: load the bundle (scan QR or upload JSON)
2. **Unwrap CEK**: X25519 ECDH → KEK → decrypt `wrapSuccessor`
3. **Fetch + Decrypt**: fetch `ciphertext` via `cid` from IPFS → decrypt with CEK
4. **UI**: show “Decrypted ✅” and render lineage `A → B` (events and/or EAS UID)

> Next inheritance (B → C): re-encrypt content with a new CEK, produce exactly two wraps (B, C), new cid and cidHash, new inherit event, and a new EAS UID.
> 
> 
> At any step, **only the current two parties** (giver + successor) can decrypt.
> 

---

## 6) Security Requirements (MVP-level, must keep)

- **Two-party readability rule** per step: keep **only two wraps** (giver, successor) for the active CEK
- **Key binding**: each user’s X25519 `encPub` is **signed by the wallet** to prevent key-swap attacks
- **AES-GCM IV**: unique per encryption; IV can be public
- **Bundle signature**: the originator signs the bundle; verify client-side
- **No plaintext or CEK server-side**; decryption is **client-only**
- **On-chain never stores content** (only `cidHash`)
- **EAS contains no keys or content** (claims/tags only)

---

## 7) Development Plan (2 days)

**Day 1 – AM (On-chain)**

- Implement Stylus `Registry` with `register_secret / inherit` + events
- Deploy to Arbitrum testnet (Stylus environment)

**Day 1 – PM (Front/Crypto/Storage)**

- Wallet connect (RainbowKit / wagmi)
- IPFS upload; AES-GCM encryption; `register_secret` end-to-end

**Day 2 – AM (Handoff/Decrypt)**

- X25519 keypairs + wallet-signature binding
- CEK wrap/unwarp; bundle JSON; QR + file download
- `inherit` call and event display

**Day 2 – PM (Evidence/UX)**

- (Recommended) EAS attestation issue + `prevUID` linking
- Lineage view (`A → B`) with timestamps
- Full demo script walkthrough (60–90s)

---

## 8) Risks & Fallbacks

- **IPFS latency** → pre-pin a tiny ciphertext; show “Decrypted ✅” badge for the demo
- **Handoff channel issues** → provide both QR and file download paths
- **Stylus hiccups** → keep contract minimal; pre-record a successful `register` + `inherit` in case of network issues
- **EAS downtime** → skip; the core demo works with Stylus + IPFS + bundle only

---

## 9) Interop via EAS Tags (for other protocols/orgs)

- Use `inheritanceType` to tag the kind of information:
    
    Examples: `recipe`, `technique`, `manuscript`, `design-notes`, `market-knowhow`, `healing-method`, `ritual`, `performance-notes`
    
- External protocols or cultural organizations can **query EAS by UID / type** to analyze or support specific inheritance categories (e.g., funding, curation, registries).
- Keep `prevUID` chaining for **navigable lineage**.

---

## 10) Why this wins (consistency + speed)

- **Stylus** focuses on **verifiable facts**; minimal Rust surface → fast build, clear demos
- **Client-side crypto + IPFS** avoids server trust and keeps scope tight
- **No mandatory messaging stack**; payload hand-off via QR/file is robust and demo-friendly
- **EAS tags** create an **interoperable public footprint** without leaking secrets

## Minimal Stylus Interface (for reference)

- `register_secret(bytes32 cid_hash, bytes meta) -> uint256 secret_id`
- `inherit(uint256 secret_id, address to)`
- `event SecretRegistered(uint256 indexed secretId, address indexed owner, bytes32 cidHash, uint256 time)`
- `event Inherited(uint256 indexed secretId, address indexed from, address indexed to, uint256 time)`

---

---

# User Flow (MVP, Notion-ready)

## 0) Roles

- **Originator (giver)**: owns the secret.
- **Successor (receiver)**: designated inheritor.
- **Observer**: can verify lineage only (never sees content).

---

## 1) Preconditions (first-time only)

- Both parties have wallets on **Arbitrum testnet**.
- In the app: **Connect Wallet**.
- App generates a local **X25519 keypair** (client-side) and **binds encPub to the wallet** (wallet signs a message proving ownership).
    
    Result: `{ encPub, walletSignature }` stored client-side (and optionally published).
    

---

## 2) Register Secret (Originator)

Goal: encrypt the content, store it off-chain, register its reference on-chain.

1. **Encrypt** (client):
    - Generate `CEK` (AES-GCM 256).
    - `ciphertext = AES-GCM(CEK, plaintext)` (unique IV).
2. **Store** (IPFS):
    - Upload `ciphertext` → get `cid`.
    - Compute `cidHash = keccak256(cid)`.
3. **Commit** (Stylus):
    - `register_secret(cidHash)` → emits `SecretRegistered(secretId, owner, cidHash, time)`.
    - UI shows Tx hash and `secretId`.

**Outputs**: `secretId`, `cid`, `cidHash`, registration Tx hash.

---

## 3) Inherit (Originator → Successor)

Goal: ensure only the **current two people** can decrypt; record the lineage.

1. **Wrap CEK for two parties** (client):
    - `wrapOriginator` for Originator’s `encPub`.
    - `wrapSuccessor` for Successor’s `encPub`.
        
        *(Exactly two wraps; no third copy.)*
        
2. **Create signed bundle** (handoff payload):

```
{
  "version": "1",
  "secretId": 123,
  "cid": "bafy... ",
  "cidHash": "0x...",
  "wrapOriginator": "base64",
  "wrapSuccessor": "base64",
  "originatorWallet": "0xA...",
  "successorWallet": "0xB...",
  "originatorEncPub": "base64",
  "successorEncPub": "base64",
  "originatorSignature": "0x...",
  "createdAt": 1712345678
}

```

- Sign the canonicalized JSON with the **originator’s wallet**.
1. **Deliver bundle**:
    - Show **QR** or let user **Download JSON** (any channel is fine).
2. **Record lineage** (Stylus):
    - `inherit(secretId, to=successor)` → emits `Inherited(secretId, from, to, time)`.
3. **(Recommended) EAS attestation**:
    - Issue `Inheritance_v1` with fields: `secretId`, `inheritanceType (bytes32 tag)`, `from`, `to` *or* `toCommitment`, `cidHash`, `prevUID`.
    - Use `prevUID` to link the chain (lineage).

**Outputs**: signed bundle (QR/file), inheritance Tx hash, optional EAS UID.

---

## 4) Receive & Decrypt (Successor)

Goal: verify provenance and decrypt locally.

1. **Import bundle**: scan QR or upload JSON.
2. **Auto-verify**:
    - Verify originator’s **wallet signature** over the bundle.
    - Check Stylus `Inherited(... to=me)` exists.
    - Confirm `keccak256(cid) == cidHash`.
3. **Decrypt** (client):
    - Unwrap `wrapSuccessor` with local X25519 privkey → get `CEK`.
    - Fetch `ciphertext` from IPFS by `cid`.
    - `plaintext = AES-GCM(CEK, ciphertext)`.
4. **UI**: show **“Decrypted ✅”**, plus lineage `A → B` (timestamps / Tx links).
    - Optional: link EAS UID with `inheritanceType` tag.

**Outputs**: readable content (local only), verified lineage view.

---

## 5) Next Inheritance (B → C)

Goal: keep the “**only the current two** can read” rule.

1. B decrypts current content with old `CEK`.
2. Re-encrypt with **new CEK** → upload → new `cid`/`cidHash`.
3. Produce **two wraps** only (for **B** and **C**).
4. Deliver new bundle; call `inherit(secretId, to=C)`.
5. (Optional) EAS with `prevUID` link.

Result: only **B & C** can read the current version; prior versions remain separate by CID.

---

## 6) Screens (minimum)

- **Register (Originator)**
    
    `Connect Wallet` → `Encrypt & Upload` → `Register on-chain` → show Tx + `secretId`
    
- **Inherit (Originator)**
    
    Pick `secretId` → `Wrap & Sign Bundle` → `Show QR / Download JSON` → `Record lineage` (Tx) → *(optional)* `Issue EAS`
    
- **Receive (Successor)**
    
    `Connect Wallet` → *(first time)* `Set up decryption key` & `Bind to wallet` → `Scan QR / Import JSON` → `Verify` → `Decrypt` → `Decrypted ✅` → `View lineage`
    

---

## 7) Security Rules (must-keep)

- **Two-party readability**: exactly **two wraps** (giver + successor) per active CEK.
- **Key binding**: bind each `encPub` to wallet via signature (prevents key-swap/MITM).
- **AES-GCM IV**: unique per encryption; IV can be public.
- **Bundle signature**: originator signs; verify in client.
- **No plaintext/CEK server-side**; chain stores **`cidHash` only**.
- **EAS** contains **no keys/content** (claims/tags only).

---

## 8) Success Criteria (demo)

- `SecretRegistered` and `Inherited` **Tx hashes visible** in UI.
- Successor completes **bundle import → verify → decrypt** and sees **Decrypted ✅**.
- Lineage `A → B` with timestamps is rendered.
- *(Optional)* EAS UID shows **`inheritanceType` tag** for external reference.

---

## 9) Fallbacks

- **QR too large** → use **bundle.json download** and import.
- **IPFS slow** → use a **small pre-pinned sample**; show successful decrypt badge.
- **Network hiccups** → keep **screenshot/recording** of successful Tx.
- **EAS down** → skip; core demo works with Stylus + IPFS + bundle.

---

## 10) Glossary

- **CEK** (Content Encryption Key): symmetric key (AES-GCM) for the content.
- **ciphertext**: encrypted content.
- **cid / cidHash**: IPFS content ID / its `keccak256` (stored on-chain).
- **wrap**: CEK encrypted for a specific recipient’s public key; only that recipient can unwrap.

---

This flow is intentionally minimal, consistent, and hackathon-friendly: **Stylus for facts**, **IPFS for encrypted blobs**, **client-side crypto for access**, and **EAS tags** for interoperable lineage metadata.

Thinking

ChatGPT can make mistakes. Check important info.
