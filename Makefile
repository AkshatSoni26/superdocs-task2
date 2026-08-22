# SuperDocs Task 2: Supplier ESG & Code-of-Conduct Cycle Makefile
# All commands run locally without Docker

.PHONY: help install test dev-backend dev-frontend backend frontend build clean

help:
	@echo "================================================================="
	@echo " SuperDocs Task 2: Supplier ESG Cycle (No Docker)"
	@echo "================================================================="
	@echo " Available commands:"
	@echo "   make install       - Install backend (uv) and frontend (npm) dependencies"
	@echo "   make test          - Run the 12 offline backend unit tests (pytest)"
	@echo "   make backend       - Start the FastAPI backend on http://localhost:8001"
	@echo "   make frontend      - Start the Next.js frontend on http://localhost:3031"
	@echo "   make build         - Build the Next.js frontend production bundle"
	@echo "   make clean         - Remove temporary cache and build artifacts"
	@echo "================================================================="

# --- Dependency Installation ---
install:
	@echo "==> Installing backend dependencies with uv..."
	cd backend && uv sync
	@echo "==> Installing frontend dependencies with npm..."
	cd frontend && npm install

# --- Automated Testing ---
test:
	@echo "==> Running Task 2 offline test suite..."
	cd backend && uv run pytest -v

# --- Local Services (Run in 2 separate terminal windows) ---
backend: dev-backend
dev-backend:
	@echo "==> Starting FastAPI backend on http://localhost:8001..."
	cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

frontend: dev-frontend
dev-frontend:
	@echo "==> Starting Next.js frontend on http://localhost:3031..."
	cd frontend && npm run dev

# --- Production Build ---
build:
	@echo "==> Building Next.js frontend..."
	cd frontend && npm run build

# --- Cleanup ---
clean:
	@echo "==> Cleaning cache and temporary artifacts..."
	rm -rf backend/.pytest_cache backend/__pycache__ backend/app/**/__pycache__
	rm -rf frontend/.next
