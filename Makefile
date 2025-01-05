.PHONY: install clean api ui migrate migration

install:
	uv venv && . .venv/bin/activate && uv sync
	cd frontend && bun install

clean:
	rm -rf .venv frontend/node_modules *.db
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

api:
	uv run uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

ui:
	cd frontend && bun dev --host 0.0.0.0

upgrade:
	PYTHONPATH=. uv run alembic upgrade head


downgrade:
	PYTHONPATH=. uv run alembic downgrade

autogenerate-revision:
	PYTHONPATH=. uv run alembic revision --autogenerate -m "$(name)"
