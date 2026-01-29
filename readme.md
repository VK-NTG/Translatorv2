### ✅ `KK-AI-TRANSLATOR`

```md
# 🧠 KK AI Translator

A modular translation system with a Python Flask API and optional React frontend, fully containerized for local use and Azure deployment.

---

## 🚀 Features

- 🔌 **Flask + Flask-RESTX** API with Swagger UI
- 🎨 Optional **React frontend** built with Vite + Tailwind
- 🐳 **Dockerized** API-only or full-stack builds
- 🔁 **Live reload** support for Python-only local dev
- ✅ **Test support** via Docker-based pytest runs
- ☁️ **Azure Web App deployment** for NONPROD
- ⚙️ **Makefile-based workflow** (build, test, deploy, dev)

---

## 📦 Folder Structure

KK-AI-Translator/
├── Makefile # Build, test, run, deploy tasks
├── Dockerfile # Full-stack (API + React)
├── Dockerfile.api-only # API-only Docker build
│
├── python-be/
│ ├── Dockerfile.test # Pytest container
│ ├── dev-requirements.txt
│ ├── requirements.txt
│ ├── src/
│ │ ├── app.py # Flask entrypoint
│ │ ├── auth/ # API key protection
│ │ ├── db/ # DB init / helpers
│ │ ├── models/ # ORM models
│ │ ├── routes/ # Namespaced API routes
│ │ └── services/ # External integrations or business logic
│ └── tests/ # Pytest-based tests
│
├── react-fe/
│ ├── package.json
│ ├── tsconfig.json
│ ├── vite.config.ts
│ ├── tailwind.config.js
│ ├── public/
│ └── src/
│ ├── App.tsx
│ └── ...

---

## 🧑‍💻 Local Development (Python API only)

Run Flask in development mode with auto-reload (no Docker):

```bash
make dev
````

This will:

- Create and activate a `venv` inside `python-be/`
- Install `dev-requirements.txt`
- Run `src/app.py` with live reload and `.env` support

> ✅ Requirements: Python 3.11+, `make`, and virtualenv support

---

## 🧪 Testing

Run all `pytest` tests in a Docker container:

```bash
make test
```

This will:

- Build a Docker image using `python-be/Dockerfile.test`
- Run `pytest` from the `tests/` folder

---

## 🐳 Docker Usage

### Build and run API-only (no frontend):

```bash
make build-api
make run-api
```

This builds a lightweight container from `Dockerfile.api-only`.

Accessible at: [http://localhost:80](http://localhost:80)

---

### Build and run Full stack (API + React frontend):

```bash
make build-full
make run-full
```

This builds a multi-stage Docker image from `Dockerfile` which includes:

- `react-fe/` build output (via `vite`)
- Copied into `src/static/` in the Flask app

Accessible at: [http://localhost:80](http://localhost:80)

---

## ☁️ Azure Deployment (NONPROD)

### Prerequisites:

1. **Azure CLI Login**:
```bash
az login
```

2. **Environment Configuration**:
   - Ensure `.env` file exists with `AZURE_ACR_PASSWORD`
   - React frontend must use relative URLs for production (configured in `.env.production`)

### Deploy Full Stack (Recommended):

```bash
make push-full && make deploy-full
```

This will:
1. Run tests to ensure code quality
2. Build multi-stage Docker image (React frontend + Python API)
3. Push to Azure Container Registry
4. Deploy to Azure Web App
5. Restart the web app

### Current Deployment Settings:

- **Web App**: `translator-api-test`
- **Resource Group**: `KK-AI-NONPROD-ChatBot`
- **ACR**: `kkainonprodacr.azurecr.io`
- **Live URL**: https://translator-api-test.azurewebsites.net

### Health Check:

After deployment, verify with:
```bash
curl -H "x-api-key: kk-super-secret-api-key" https://translator-api-test.azurewebsites.net/api/v1/misc/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "KK AI Translator", 
  "version": "0.5.0-debug",
  "provider": "Azure Translator + OpenAI",
  "auth": "API Key + JWT Bearer"
}
```

### API-only deployment (if needed):

```bash
make push-api && make deploy-api
```

> 💡 You can easily reuse this flow later for PROD by copying the `deploy-*` targets in the Makefile and updating the names.

---

## 🌍 Environment Configuration

### Backend Configuration (`.env`):
```
DATABASE_URL=your_postgres_url
API_KEY=kk-super-secret-api-key
AZURE_ACR_PASSWORD=your_acr_password
# ... other backend settings
```

### Frontend Configuration:

**Development** (`.env.development`):
```
VITE_API_URL=http://localhost:5001/api/v1
VITE_API_KEY=kk-super-secret-api-key
```

**Production** (`.env.production`) - **CRITICAL**:
```
VITE_API_URL=/api/v1
VITE_API_KEY=kk-super-secret-api-key
```

> ⚠️ **Important**: The React frontend MUST use relative URLs (`/api/v1`) in production since the Flask backend serves the frontend as static files. Using `localhost:5001` will cause connection errors in deployed environments.

The Dockerfile automatically sets `NODE_ENV=production` during build to use the correct environment file.

---

## 💬 API Usage

Swagger docs are available at:

```
GET /docs
```

Example endpoints (mounted under `/api/v1/`):

- `GET /api/v1/misc/ping`
- `GET /api/v1/sessions/test`

All requests must include:

```
x-api-key: kk-super-secret-api-key
```

> Set `API_KEY` in your `.env` or Azure config to change this value.

---

## ✅ Quickstart Summary

```bash
# Local dev
make dev

# Run tests
make test

# Build & run API-only
make build-api
make run-api

# Build & run full stack
make build-full
make run-full

# Push and deploy
make push-api && make deploy-api
make push-full && make deploy-full
```

---

## 🧼 Linting

You can add `flake8`, `black`, `mypy`, or others to `dev-requirements.txt` and use them in dev or CI manually.

Example:

```bash
black python-be/src
flake8 python-be/src
```
