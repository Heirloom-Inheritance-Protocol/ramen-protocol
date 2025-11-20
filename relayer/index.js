import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import addMemberRoute from './routes/addMember.js';
import checkMemberRoute from './routes/checkMember.js';
import getVaultsRoute from './routes/getVaults.js';
import membersRoute from './routes/members.js';
import adminRoute from './routes/admin.js';
import createVaultRoute from './routes/createVault.js';
import { HERILOOM_CONTRACT_ADDRESS } from './config/constants.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Validate critical environment variables
if (!process.env.PRIVATE_KEY) {
  console.error('❌ Error: PRIVATE_KEY not set in .env file');
  process.exit(1);
}

if (!process.env.RPC_URL) {
  console.error('❌ Error: RPC_URL not set in .env file');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/vault/create', createVaultRoute);
app.use('/api/vault/add-member', addMemberRoute);
app.use('/api/vault/check-member', checkMemberRoute);
app.use('/api/vaults', getVaultsRoute);
app.use('/api/vault/members', membersRoute);
app.use('/api/admin', adminRoute);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Heritage Inheritance Relayer is running',
    contract: HERILOOM_CONTRACT_ADDRESS,
    network: process.env.RPC_URL || 'Scroll Sepolia'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Heritage Inheritance Relayer API',
    endpoints: {
      health: '/health',
      createVault: '/api/vault/create',
      addMember: '/api/vault/add-member',
      checkMember: '/api/vault/check-member',
      getVaults: '/api/vaults',
      getMembers: '/api/vault/members/:vaultId',
      admin: '/api/admin'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ====================================');
  console.log(`   Heritage Inheritance Relayer Server`);
  console.log('   ====================================');
  console.log(`   🌐 URL: http://localhost:${PORT}`);
  console.log(`   📡 Network: ${process.env.RPC_URL || 'Scroll Sepolia'}`);
  console.log(`   📝 Contract: ${HERILOOM_CONTRACT_ADDRESS}`);
  console.log('   ====================================');
  console.log('');
});
