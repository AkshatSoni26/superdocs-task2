.PHONY: install test test-backend dev-backend dev-frontend run build clean

install:
	@echo "Syncing backend dependencies with uv..."
	cd backend && uv sync
	@echo "Installing frontend dependencies with bun..."
	cd frontend && bun install

test: test-backend

test-backend:
	@echo "Running backend test suite with uv..."
	cd backend && uv run pytest -v

dev-backend:
	@echo "Starting FastAPI backend on port 8001 with uv..."
	cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

dev-frontend:
	@echo "Starting Next.js frontend on port 3031 with bun..."
	cd frontend && bun run dev

build:
	@echo "Building Next.js frontend with bun..."
	cd frontend && bun run build

run:
	@echo "Run 'make dev-backend' and 'make dev-frontend' in two separate terminal tabs."
