# Stylus Digital Inheritance Contract

This crate contains a Stylus smart contract that models a secure digital inheritance workflow for the Heirloom protocol. Instead of the `Counter` demo that ships with the Stylus starter, the implementation in `src/lib.rs` maintains inheritance records, tracks ownership and successor access, and enforces simple safety guards directly in Rust.

## Storage Layout

The contract uses the [`sol_storage!`](https://github.com/OffchainLabs/stylus-sdk-rs) macro to declare a persistent storage schema:

- `counter: StorageU256` – auto-incrementing identifier assigned to each inheritance record.
- `inheritances: StorageMap<U256, Inheritance>` – mapping from inheritance id to the stored record.
- `owner_to_ids: StorageMap<Address, StorageVec<U256>>` – per-owner index of inheritance ids they created.
- `successor_to_ids: StorageMap<Address, StorageVec<U256>>` – per-successor index for quick lookups.

Each `Inheritance` record stores:

- `owner` – address that created the inheritance.
- `successor` – designated beneficiary.
- `ipfs_hash`, `tag`, `file_name` – metadata pointing to the encrypted payload.
- `file_size`, `timestamp` – additional context for clients.
- `is_active`, `is_claimed` – lifecycle flags that gate claiming/revoking.

## External Entry Points

The router implementation in `lib.rs` exposes the following Stylus-compatible ABI:

- `create_inheritance(successor, ipfs_hash, tag, file_name, file_size) -> id`
  - Rejects empty metadata, zero addresses, and owners assigning themselves.
  - Returns the `U256` id after persisting the record and updating both indices.
- `claim_inheritance(inheritance_id)`
  - Only the configured successor may call this.
  - Fails if the record is inactive or already claimed; otherwise flips `is_claimed`.
- `revoke_inheritance(inheritance_id)`
  - Owner-only action.
  - Marks the record inactive when it has not been claimed yet.
- `get_inheritance(inheritance_id) -> Option<Inheritance>`
  - Read-only fetch that mirrors the stored struct.
- `get_owner_inheritances(owner) -> Vec<U256>` and `get_successor_inheritances(successor) -> Vec<U256>`
  - On-chain indices used by the frontend to enumerate inheritance ids.
- `can_access_inheritance(...)` _(reserved)_
  - Helper stub intended for future use to centralize cross-role checks.

All mutating entry points return `Result<_, Vec<u8>>`, which surfaces human-readable revert messages to Solidity callers.

## Building & Running

Install Rust and the Stylus toolchain:

```bash
cargo install --force cargo-stylus cargo-stylus-check
rustup target add wasm32-unknown-unknown
```

You can now build and validate the WASM artifact:

```bash
cargo stylus check
```

`cargo stylus check` compiles the program, runs the Stylus bytecode validation pass, and prints the compressed WASM size. Use `cargo stylus deploy` with your wallet configuration to push the program to the Stylus testnet once the checks pass.

## Exporting the ABI

The `export-abi` feature is enabled by default. To regenerate the Solidity ABI for downstream tooling:

```bash
cargo stylus export-abi
```

`src/main.rs` wires the feature flag so that running the command emits the ABI JSON artefact aligned with the Digital Inheritance interface described above.

## Interacting From Off-Chain

Because Stylus contracts follow the Ethereum ABI, any EVM-compatible toolchain can call the program. Typical flows:

- Enumerate inheritance ids for an address using `get_owner_inheritances` or `get_successor_inheritances`.
- Fetch metadata with `get_inheritance`.
- Invoke `claim_inheritance` from the designated successor wallet or `revoke_inheritance` from the owner wallet when records should expire.

Frontends in this repository (`frontend/src/lib/services/heriloomProtocol.ts`) consume the same ABI to reconcile IPFS payloads and lifecycle status.

## Deployment Checklist

1. Produce the WASM artefact and confirm validation: `cargo stylus check`.
2. Export the ABI for clients: `cargo stylus export-abi`.
3. Set environment variables (RPC endpoint, signer key) or use CLI flags.
4. Deploy and activate with `cargo stylus deploy --private-key-path=<PATH>`.

Refer to the [Stylus testnet docs](https://docs.arbitrum.io/stylus/reference/testnet-information) for RPCs, faucets, and wallet guidance.

## License

Dual-licensed under Apache-2.0 or MIT, consistent with the upstream Stylus tooling.
