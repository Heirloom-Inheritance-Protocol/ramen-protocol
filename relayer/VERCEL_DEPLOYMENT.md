# Deploying Relayer to Vercel

This guide explains how to deploy the Heritage Inheritance Relayer to Vercel and configure environment variables.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed (optional, for CLI deployment):
   ```bash
   npm i -g vercel
   ```

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   - Make sure the `relayer` folder is in your repository

2. **Import Project in Vercel**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your repository
   - **Important**: Set the **Root Directory** to `relayer` (not the project root)
   - Framework Preset: "Other"
   - Build Command: Leave empty (or `npm install`)
   - Output Directory: Leave empty
   - Install Command: `npm install`

3. **Configure Environment Variables** (see below)

4. **Deploy**
   - Click "Deploy"

### Method 2: Deploy via Vercel CLI

1. **Navigate to relayer directory**
   ```bash
   cd relayer
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked for root directory, confirm it's the current directory

4. **Set Environment Variables** (see below)

5. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Required Environment Variables

You **must** add these environment variables in Vercel:

### 1. Access Vercel Environment Variables

**Via Dashboard:**
- Go to your project in Vercel Dashboard
- Click on "Settings" → "Environment Variables"
- Add each variable below

**Via CLI:**
```bash
vercel env add PRIVATE_KEY
vercel env add RPC_URL
# ... etc
```

### 2. Required Variables

#### `PRIVATE_KEY` ⚠️ **CRITICAL**
- **Description**: Your wallet's private key (with funds for gas)
- **Example**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- **Security**: Never commit this to git. Mark as "Sensitive" in Vercel.
- **Note**: The wallet must have funds on the target network (Scroll Sepolia)

#### `RPC_URL` ⚠️ **CRITICAL**
- **Description**: Blockchain RPC endpoint
- **Example**: `https://sepolia-rpc.scroll.io`
- **Scroll Sepolia**: `https://sepolia-rpc.scroll.io`
- **Other networks**: Use appropriate RPC URL

#### `MONGODB_URI` ⚠️ **REQUIRED**
- **Description**: MongoDB connection string
- **Example**: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
- **Note**: Required for routes that store/query identity commitments

### 3. Optional Variables

#### `PORT`
- **Description**: Server port (Vercel sets this automatically)
- **Default**: `3001` (not used in Vercel, Vercel handles ports)
- **Note**: You can omit this in Vercel

#### `FRONTEND_URL`
- **Description**: Your frontend URL for CORS configuration
- **Example**: `https://your-frontend.vercel.app`
- **Default**: `http://localhost:5173`
- **Important**: Set this to your production frontend URL

#### `HERILOOM_CONTRACT_ADDRESS`
- **Description**: ZkHeriloom3 contract address
- **Default**: `0xC8a7872EDfD72d812FE08949986C0EbE5B452dDb` (from constants.js)
- **Note**: Only set if you're using a different contract address

## Setting Environment Variables in Vercel Dashboard

1. **Go to Project Settings**
   - Open your project in Vercel Dashboard
   - Click "Settings" in the top navigation

2. **Navigate to Environment Variables**
   - Click "Environment Variables" in the left sidebar

3. **Add Each Variable**
   - Click "Add New"
   - Enter the **Key** (e.g., `PRIVATE_KEY`)
   - Enter the **Value** (your actual value)
   - Select **Environments**:
     - ✅ Production
     - ✅ Preview
     - ✅ Development (optional)
   - Click "Save"

4. **Repeat for All Variables**
   - Add `PRIVATE_KEY`
   - Add `RPC_URL`
   - Add `MONGODB_URI`
   - Add `FRONTEND_URL` (if different from default)
   - Add `HERILOOM_CONTRACT_ADDRESS` (if different from default)

## Important Notes

### ⚠️ Security

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Mark sensitive variables** - In Vercel, you can mark variables as "Sensitive"
3. **Use separate wallets** - Don't use your main wallet's private key
4. **Rotate keys** - If a key is compromised, rotate it immediately

### 🔧 Vercel-Specific Considerations

1. **Serverless Functions**
   - Vercel converts your Express app to serverless functions
   - Each route becomes a serverless function
   - Cold starts may occur (first request after inactivity)

2. **Function Timeout**
   - Vercel has execution time limits:
     - Hobby: 10 seconds
     - Pro: 60 seconds
   - Blockchain transactions may take longer - consider async processing

3. **Environment Variables**
   - Variables are encrypted at rest
   - Available at runtime via `process.env`
   - Changes require redeployment

4. **CORS**
   - Update `FRONTEND_URL` to your production frontend URL
   - Or set to `*` for development (not recommended for production)

### 📝 After Deployment

1. **Test the Health Endpoint**
   ```
   GET https://your-relayer.vercel.app/health
   ```

2. **Update Frontend**
   - Update your frontend's API URL to point to the Vercel deployment
   - Example: `https://your-relayer.vercel.app`

3. **Monitor Logs**
   - View logs in Vercel Dashboard → "Deployments" → Click a deployment → "Functions" → View logs

## Troubleshooting

### "PRIVATE_KEY not set" Error
- ✅ Check that `PRIVATE_KEY` is set in Vercel environment variables
- ✅ Ensure it's added to Production environment
- ✅ Redeploy after adding variables

### "RPC_URL not set" Error
- ✅ Check that `RPC_URL` is set in Vercel environment variables
- ✅ Verify the RPC URL is correct and accessible

### CORS Errors
- ✅ Set `FRONTEND_URL` to your actual frontend URL
- ✅ Check that CORS is configured correctly in `index.js`

### MongoDB Connection Errors
- ✅ Verify `MONGODB_URI` is correct
- ✅ Check MongoDB Atlas IP whitelist (allow Vercel IPs or `0.0.0.0/0` for testing)
- ✅ Ensure MongoDB cluster is running

### Function Timeout
- ✅ Consider using Vercel Pro plan for longer timeouts
- ✅ Or implement async processing (queue transactions)

### Contract ABI Not Found
- ✅ Ensure `forge build` is run before deployment
- ✅ The `out/` directory with compiled contracts must be in the repository
- ✅ Or include ABI in the deployment

## Example Vercel Environment Variables Setup

```
PRIVATE_KEY=0x... (your private key)
RPC_URL=https://sepolia-rpc.scroll.io
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://your-frontend.vercel.app
HERILOOM_CONTRACT_ADDRESS=0xC8a7872EDfD72d812FE08949986C0EbE5B452dDb
```

## Quick Reference

**Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
**Environment Variables**: Project → Settings → Environment Variables
**Deployment Logs**: Project → Deployments → [Deployment] → Functions → Logs

