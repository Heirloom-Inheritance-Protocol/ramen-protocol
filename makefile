-include .env

.PHONY: deploy verify help

# Default account key - can be overridden with DEPLOY_KEY env var
DEPLOY_KEY ?= deployer

# Scroll Sepolia Network Arguments
SCROLL_SEPOLIA_ARGS := --rpc-url $(RPC_URL_SCROLL_SEPOLIA) \
                       --account $(DEPLOY_KEY) \
                       --broadcast \
                       --verify \
                       --verifier-url https://api-sepolia.scrollscan.com/api \
                       --verifier scroll-sepolia \
                       --via-ir

# Deployment command
deploy:
	@echo "Deploying to Scroll Sepolia testnet"
	@forge clean
	@forge script script/DeployScrollSepolia.s.sol:DeployScrollSepolia $(SCROLL_SEPOLIA_ARGS) -vvvvvv

# Verification only (for already deployed contracts)
verify:
	@echo "Verifying contracts on Scroll Sepolia"
	@forge verify-contract \
		--rpc-url $(RPC_URL_SCROLL_SEPOLIA) \
		--verifier-url https://api-sepolia.scrollscan.com/api \
		--verifier scroll-sepolia \
		--etherscan-api-key $(SCROLLSCAN_API_KEY) \
		$(CONTRACT_ADDRESS) \
		$(CONTRACT_NAME) \
		--constructor-args $(CONSTRUCTOR_ARGS)

# Help command
help:
	@echo "================================================================================="
	@echo "                      Scroll Sepolia Deployment - Makefile"
	@echo "================================================================================="
	@echo ""
	@echo "========================== Deployment Commands ============================="
	@echo ""
	@echo "  make deploy ----------------- Deploy contracts to Scroll Sepolia testnet"
	@echo "                                 Requires: RPC_URL_SCROLL_SEPOLIA, DEPLOY_KEY"
	@echo ""
	@echo "  make verify ----------------- Verify deployed contracts on Scroll Sepolia"
	@echo "                                 Requires: CONTRACT_ADDRESS, CONTRACT_NAME,"
	@echo "                                          SCROLLSCAN_API_KEY, CONSTRUCTOR_ARGS"
	@echo ""
	@echo "================================= Environment ===================================="
	@echo ""
	@echo "  Required .env variables:"
	@echo "    RPC_URL_SCROLL_SEPOLIA  - Scroll Sepolia RPC endpoint"
	@echo "    DEPLOY_KEY              - Foundry account name for deployment (default: deployer)"
	@echo "    SCROLLSCAN_API_KEY      - ScrollScan API key for verification"
	@echo ""
	@echo "  For verification:"
	@echo "    CONTRACT_ADDRESS        - Address of deployed contract"
	@echo "    CONTRACT_NAME           - Contract name (e.g., src/Contract.sol:ContractName)"
	@echo "    CONSTRUCTOR_ARGS        - Constructor arguments (hex encoded)"
	@echo ""
	@echo "================================= Examples ===================================="
	@echo ""
	@echo "  make deploy"
	@echo "  make verify CONTRACT_ADDRESS=0x... CONTRACT_NAME=src/Contract.sol:MyContract"
	@echo ""
	@echo "================================================================================="
