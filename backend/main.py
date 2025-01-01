"""Main backend module"""

from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .schemas import SCHEMAS
from .structured_outputs import prompt_for_structured_output


class PromptRequest(BaseModel):
    """Prompt request"""

    prompt: str


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173'],  # Vite's default port
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/schemas')
async def get_schemas() -> dict[str, dict[str, Any]]:
    """Get all the schemas"""
    return {name: schema.model_json_schema() for name, schema in SCHEMAS.items()}


@app.post('/generate/{schema_name}')
async def generate_structured_output(schema_name: str, request: PromptRequest) -> dict[str, Any]:
    """Generate structured output from a prompt using a specific schema"""
    if schema_name not in SCHEMAS:
        raise HTTPException(status_code=404, detail=f'Schema {schema_name} not found')

    schema = SCHEMAS[schema_name]
    result = await prompt_for_structured_output(schema, request.prompt)
    return result.model_dump()
