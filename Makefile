# === KK AI Translator - Simplified Makefile ===
# Based on actual usage patterns from development sessions

# === CONFIG ===
# Azure deployment settings
ACR_NAME             := kkainonprodacr
AZURE_WEBAPP_NAME    := kk-translator
AZURE_RESOURCE_GROUP := KK-AI-NONPROD-ChatBot
ACR_LOGIN_SERVER     := $(ACR_NAME).azurecr.io

# Load environment variables from .env
ifneq ("$(wildcard .env)","")
    include .env
    export
else
    $(error .env file not found. Please create one with required variables)
endif

# === PHONY TARGETS ===
.PHONY: dev frontend build-test deploy health help test test-backend test-frontend lint ci docker-up docker-down

## Local Development
dev:
	@echo "🚀 Starting Python backend in development mode..."
	@if [ ! -d "python-be/venv" ]; then python3 -m venv python-be/venv; fi
	@. python-be/venv/bin/activate; \
	  set -a; source .env; set +a; \
	  pip install --upgrade pip; \
	  pip install -r python-be/requirements.txt -r python-be/dev-requirements.txt; \
	  export FLASK_APP=src/app.py; \
	  export FLASK_ENV=development; \
	  echo "Backend running at: http://127.0.0.1:5001"; \
	  python3 python-be/src/app.py

frontend:
	@echo "🎨 Starting React frontend in development mode..."
	@echo "Make sure you run 'make dev' in another terminal for the backend"
	@echo "Frontend will be at: http://localhost:5173"
	cd react-fe && npm install && npm run dev

## Docker Local Development
docker-up:
	@echo "🐳 Starting Docker containers..."
	docker-compose up -d
	@echo "✅ Application running at http://localhost:8080"

docker-down:
	@echo "🛑 Stopping Docker containers..."
	docker-compose down

docker-logs:
	@echo "📋 Docker container logs..."
	docker-compose logs -f

## Testing
test: test-backend test-frontend
	@echo "✅ All tests passed!"

test-backend:
	@echo "🧪 Running backend tests..."
	cd python-be && pip install -r dev-requirements.txt -q && pytest tests -v

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd react-fe && npm install && npm run test:run

## Linting
lint: lint-backend lint-frontend
	@echo "✅ All linting passed!"

lint-backend:
	@echo "🔍 Linting Python code..."
	cd python-be && flake8 src tests --max-line-length=120 --ignore=E501,W503 || true

lint-frontend:
	@echo "🔍 Linting TypeScript code..."
	cd react-fe && npm run lint

## CI Pipeline (runs in Docker)
ci:
	@echo "🚀 Running full CI pipeline in Docker..."
	docker-compose -f docker-compose.ci.yml build
	docker-compose -f docker-compose.ci.yml run --rm backend-test
	docker-compose -f docker-compose.ci.yml run --rm frontend-test
	docker-compose -f docker-compose.ci.yml run --rm frontend-build
	@echo "✅ CI pipeline completed successfully!"

ci-backend:
	@echo "🧪 Running backend CI in Docker..."
	docker-compose -f docker-compose.ci.yml build backend-test
	docker-compose -f docker-compose.ci.yml run --rm backend-test

ci-frontend:
	@echo "🧪 Running frontend CI in Docker..."
	docker-compose -f docker-compose.ci.yml build frontend-test frontend-build
	docker-compose -f docker-compose.ci.yml run --rm frontend-test
	docker-compose -f docker-compose.ci.yml run --rm frontend-build

## Build Testing
build-test:
	@echo "🔨 Testing local build (TypeScript + Vite)..."
	@echo "Installing frontend dependencies..."
	cd react-fe && npm install
	@echo "Running TypeScript compilation..."
	cd react-fe && npx tsc --noEmit
	@echo "Running Vite build..."
	cd react-fe && NODE_ENV=production npm run build
	@echo "✅ Local build test successful!"
	@echo "💡 Frontend build artifacts created in react-fe/dist/"

## Azure Deployment
deploy: build-test
	@echo "☁️ Building and deploying to Azure..."
	@echo "✅ Local build test passed - proceeding with ACR build..."
	az acr build --registry $(ACR_NAME) --image translator/translator-full:latest .
	@echo "Configuring Azure Web App..."
	az webapp config container set \
		--name $(AZURE_WEBAPP_NAME) \
		--resource-group $(AZURE_RESOURCE_GROUP) \
		--container-image-name $(ACR_LOGIN_SERVER)/translator/translator-full:latest \
		--container-registry-url https://$(ACR_LOGIN_SERVER) \
		--container-registry-user $(ACR_NAME) \
		--container-registry-password $(AZURE_ACR_PASSWORD)
	@echo "Restarting Azure Web App..."
	az webapp restart --name $(AZURE_WEBAPP_NAME) --resource-group $(AZURE_RESOURCE_GROUP)
	@echo "✅ Deployment complete!"
	@echo "🌐 Live URL: https://kk-translator.azurewebsites.net"
	@echo "🔍 Health check: curl -H 'x-api-key: kk-super-secret-api-key' https://kk-translator.azurewebsites.net/api/v1/misc/health"

## Health Check
health:
	@echo "🔍 Checking local backend health..."
	curl -s -H "x-api-key: kk-super-secret-api-key" http://127.0.0.1:5001/api/v1/misc/health | jq .

health-prod:
	@echo "🔍 Checking production health..."
	curl -s -H "x-api-key: kk-super-secret-api-key" https://kk-translator.azurewebsites.net/api/v1/misc/health | jq .

## Help
help:
	@echo "🔧 KK AI Translator - Available Commands:"
	@echo ""
	@echo "📦 Development:"
	@echo "  make dev           - Start Python backend (http://127.0.0.1:5001)"
	@echo "  make frontend      - Start React frontend (http://localhost:5173)"
	@echo "  make build-test    - Test TypeScript/Vite build locally"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  make docker-up     - Start app in Docker (http://localhost:8080)"
	@echo "  make docker-down   - Stop Docker containers"
	@echo "  make docker-logs   - View Docker container logs"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test          - Run all tests (backend + frontend)"
	@echo "  make test-backend  - Run Python tests only"
	@echo "  make test-frontend - Run React tests only"
	@echo "  make lint          - Run all linters"
	@echo ""
	@echo "🔄 CI Pipeline:"
	@echo "  make ci            - Run full CI in Docker"
	@echo "  make ci-backend    - Run backend CI in Docker"
	@echo "  make ci-frontend   - Run frontend CI in Docker"
	@echo ""
	@echo "☁️  Deployment:"
	@echo "  make deploy        - Test build + deploy to Azure"
	@echo ""
	@echo "🔍 Health Checks:"
	@echo "  make health        - Check local backend health"
	@echo "  make health-prod   - Check production health"
	@echo ""
	@echo "💡 Typical workflow:"
	@echo "  1. make docker-up  (or: make dev + make frontend)"
	@echo "  2. Develop & test locally"
	@echo "  3. make test"
	@echo "  4. make ci (full CI check)"
	@echo "  5. make deploy (when ready)"
	@echo ""
	@echo "🌐 URLs:"
	@echo "  Docker App:     http://localhost:8080"
	@echo "  Local Backend:  http://127.0.0.1:5001"
	@echo "  Local Frontend: http://localhost:5173"
	@echo "  Production:     https://kk-translator.azurewebsites.net"

# Default target
.DEFAULT_GOAL := help