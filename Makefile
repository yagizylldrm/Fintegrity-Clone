.PHONY: install install-backend install-frontend install-blockchain dev dev-backend dev-frontend dev-blockchain deploy-contracts test test-backend test-blockchain lint clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Installation ────────────────────────────────────────
install: install-backend install-frontend install-blockchain ## Install all dependencies

install-backend: ## Install backend Python dependencies
	cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt

install-frontend: ## Install frontend Node dependencies
	cd fintegrity-frontend && npm install

install-blockchain: ## Install blockchain Node dependencies
	cd blockchain && npm install

# ─── Development ─────────────────────────────────────────
dev-backend: ## Start backend server
	cd backend && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Start frontend dev server
	cd fintegrity-frontend && npm run dev

dev-blockchain: ## Start local Hardhat node
	cd blockchain && npx hardhat node

deploy-contracts: ## Deploy smart contracts to local Hardhat node
	cd blockchain && npx hardhat run scripts/deploy.ts --network localhost

# ─── Testing ─────────────────────────────────────────────
test: test-backend test-blockchain lint ## Run all tests

test-backend: ## Run backend API tests
	cd backend && source venv/bin/activate && pytest tests/ -v

test-blockchain: ## Run blockchain contract tests
	cd blockchain && npx hardhat test

lint: ## Run frontend linter
	cd fintegrity-frontend && npx eslint .

# ─── Utilities ───────────────────────────────────────────
clean: ## Clean generated files
	rm -rf backend/__pycache__ backend/app/__pycache__
	rm -rf fintegrity-frontend/dist
	rm -rf blockchain/artifacts blockchain/cache
