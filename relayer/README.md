# Heritage Inheritance Relayer Server

This is the backend relayer server that handles blockchain transactions for the Heritage Inheritance Protocol. It manages the private key and submits transactions to the ZkHeriloom3 smart contract on behalf of users, enabling gasless transactions for vault management and member operations.

## Setup

1. Install dependencies:
```bash
cd relayer
npm install
```

2. Create a `.env` file:
```bash
cp .env.example .env
```

3. Configure your `.env` file with:
   - `PRIVATE_KEY`: Your wallet's private key (with funds for gas)
   - `RPC_URL`: The RPC endpoint (Scroll Sepolia: `https://sepolia-rpc.scroll.io`)
   - `MONGODB_URI`: MongoDB connection string (for storing identity commitments)
   - `PORT`: Server port (default: 3001)
   - `FRONTEND_URL`: Your frontend URL for CORS (default: http://localhost:3000)
   - `HERILOOM_CONTRACT_ADDRESS`: ZkHeriloom3 contract address (or set in `config/constants.js`)

**Note:** The contract address can be configured in `relayer/config/constants.js` as `HERILOOM_CONTRACT_ADDRESS` or set as an environment variable.

## Compile Contracts

Before running the relayer, make sure to compile the contracts:

```bash
forge build
```

This generates the contract ABI at `out/zkheriloom3.sol/zkHeriloom3.json` which the relayer uses.

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Deploying to Vercel

For detailed instructions on deploying to Vercel and configuring environment variables, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

**Quick Setup:**
1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel Dashboard (set root directory to `relayer`)
3. Add environment variables in Vercel:
   - `PRIVATE_KEY` (required)
   - `RPC_URL` (required)
   - `MONGODB_URI` (required)
   - `FRONTEND_URL` (optional, for CORS)
   - `HERILOOM_CONTRACT_ADDRESS` (optional, has default)
4. Deploy!

**Note:** Make sure to run `forge build` before deploying so the contract ABI files are available.

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and configuration info.

### Create Vault
```
POST /api/vault/create
```
Creates a new vault. Note: Vaults are Semaphore groups (they're the same thing). Vaults are typically created automatically when creating an inheritance.

### Add Member to Vault
```
POST /api/vault/add-member
Content-Type: application/json

{
  "vaultId": 1,
  "identityCommitment": "0x..."
}
```
Adds a user to a vault. Note: Vaults are Semaphore groups, so vaultId = groupId.

### Check Member
```
GET /api/vault/check-member?vaultId=1&identityCommitment=0x...
```
Checks if an identity commitment is a member of a vault.

### Get Vaults
```
GET /api/vaults
```
Returns all vault IDs created in the contract.

### Get Vault Members
```
GET /api/vault/members/:vaultId
```
Returns all members of a specific vault, including merkle tree metadata.

### Admin Operations
```
POST /api/admin
```
Admin-only operations (contract admin functions).

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit your `.env` file
- Keep your private key secure
- The wallet associated with the private key needs to have funds for gas
- Use a dedicated wallet for the relayer (not your main wallet)
- Consider implementing rate limiting in production
- Add authentication if needed

## Troubleshooting

- **"Contract ABI not loaded"**: Run `forge build` in the root directory to compile contracts
- **"Insufficient funds"**: Add test ETH to your relayer wallet on Scroll Sepolia
- **Port already in use**: Change the PORT in `.env`
- **MongoDB connection errors**: Check your `MONGODB_URI` and ensure your IP is whitelisted if using MongoDB Atlas

## Network

This relayer is configured for **Scroll Sepolia** testnet:
- RPC URL: `https://sepolia-rpc.scroll.io`
- Semaphore Contract: `0x689B1d8FB0c64ACFEeFA6BdE1d31f215e92B6fd4`
- Explorer: https://sepolia.scrollscan.com

## Important Note: Vaults = Groups

In this protocol, **vaults and Semaphore groups are the same thing**. The contract uses "vault" terminology, but internally they are Semaphore groups. When you see `vaultId` in the API, it's the same as `groupId` in Semaphore.

## Database

The relayer uses MongoDB to store identity commitments:
- Database: `HERILOOM`
- Collection: `Commitments`
- Stores: vaultId (which is the Semaphore groupId), identityCommitment, transactionHash, blockNumber, merkleTreeData, timestamp
