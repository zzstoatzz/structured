# Install dependencies
install:
    uv venv && . .venv/bin/activate && uv sync
    cd frontend && bun install

# Clean build artifacts
clean:
    rm -rf .venv frontend/node_modules *.db
    find . -type d -name "__pycache__" -exec rm -rf {} +
    find . -type f -name "*.pyc" -delete

# Run API server
api:
    uv run uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Run UI development server
ui:
    cd frontend && bun dev --host 0.0.0.0

# Run database migrations
upgrade:
    PYTHONPATH=. uv run alembic upgrade head

# Rollback database migrations
downgrade:
    PYTHONPATH=. uv run alembic downgrade

# Generate new migration
autogenerate-revision name:
    PYTHONPATH=. uv run alembic revision --autogenerate -m "{{name}}"