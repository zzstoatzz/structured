# structured

a tool for generating structured outputs from natural language prompts.

## setup

### backend
```bash
# create and activate virtual environment
uv venv
source .venv/bin/activate

# install dependencies
uv sync

# start the backend server
uvicorn backend.main:app --reload
```

### frontend
```bash
# navigate to frontend directory
cd frontend

# install dependencies
npm install

# start the development server
npm run dev
```

## structure

- `backend/`: FastAPI server that handles structured output generation
  - `main.py`: API endpoints
  - `schemas.py`: pydantic models for structured outputs (yes, i know i could be using [this](https://docs.pydantic.dev/latest/integrations/datamodel_code_generator/))
  - `structured_outputs.py`: core logic for generating structured outputs

- `frontend/`: React + TypeScript + Tailwind UI
  - built with Vite
  - uses shadcn/ui components

## usage

1. start both the backend and frontend servers
2. navigate to `http://localhost:5173`
3. select a schema and enter a prompt
4. get structured output based on your prompt