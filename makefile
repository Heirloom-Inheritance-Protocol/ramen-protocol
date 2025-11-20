-include .env

.PHONY: deploy verify help

# Default account key - can be overridden with DEPLOY_KEY env var
DEPLOY_KEY ?= testingAddress

# Scroll Sepolia Network Arguments
SCROLL_SEPOLIA_ARGS := --rpc-url $(RPC_URL_SCROLL_SEPOLIA) \
                       --account $(DEPLOY_KEY) \
                       --broadcast \
                       --verify \
                       --verifier-url https://api-sepolia.scrollscan.com/api \
                       --verifier blockscout \
                       --etherscan-api-key $(SCROLLSCAN_API_KEY) \
                       --via-ir

# Deployment command
deploy:
	@echo "Deploying ZkHeriloom3 to Scroll Sepolia testnet"
	@forge clean
	@forge script src/contract/script/zkheriloom3.s.sol:DeployZkHeriloom3 $(SCROLL_SEPOLIA_ARGS) -vvvvvv

# Verification only (for already deployed contracts)
verify:
	@if [ -z "$(CONTRACT_ADDRESS)" ] || [ -z "$(CONTRACT_NAME)" ]; then \
		echo "❌ Error: CONTRACT_ADDRESS and CONTRACT_NAME are required"; \
		echo "Usage: make verify CONTRACT_ADDRESS=0x... CONTRACT_NAME=src/contract/zkheriloom3.sol:ZkHeriloom3"; \
		exit 1; \
	fi
	@echo "Verifying contract on Scroll Sepolia via Sourcify..."
	@forge verify-contract \
		--rpc-url $(RPC_URL_SCROLL_SEPOLIA) \
		--verifier sourcify \
		--chain-id 534351 \
		$(CONTRACT_ADDRESS) \
		$(CONTRACT_NAME) \
		$(if $(CONSTRUCTOR_ARGS),--constructor-args $(CONSTRUCTOR_ARGS),) || \
	(echo "" && echo "⚠️  Verification failed. Manual: https://sepolia.scrollscan.com/address/$(CONTRACT_ADDRESS)#code")

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
	@echo "                                 Requires: CONTRACT_ADDRESS, CONTRACT_NAME"
	@echo ""
	@echo "================================= Environment ===================================="
	@echo ""
	@echo "  Required .env variables:"
	@echo "    RPC_URL_SCROLL_SEPOLIA  - Scroll Sepolia RPC endpoint"
	@echo "    DEPLOY_KEY              - Foundry account name for deployment (default: testingAddress)"
	@echo ""
	@echo "  For verification:"
	@echo "    CONTRACT_ADDRESS        - Address of deployed contract"
	@echo "    CONTRACT_NAME           - Contract name (e.g., src/contract/zkheriloom3.sol:ZkHeriloom3)"
	@echo "    CONSTRUCTOR_ARGS        - Constructor arguments (optional, hex encoded)"
	@echo ""
	@echo "================================= Examples ===================================="
	@echo ""
	@echo "  make deploy"
	@echo "  make verify CONTRACT_ADDRESS=0x... CONTRACT_NAME=src/contract/zkheriloom3.sol:ZkHeriloom3"
	@echo ""
	@echo "================================================================================="
