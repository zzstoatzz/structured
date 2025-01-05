.PHONY: install clean api ui

install:
	uv venv && . .venv/bin/activate && uv sync
	cd frontend && bun install

clean:
	rm -rf .venv frontend/node_modules *.db
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

api:
	uv run uvicorn backend.main:app --reload

ui:
	cd frontend && bun dev