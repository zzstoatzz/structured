"""Main backend module"""

from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import VERSION
from .logging import get_logger
from .schemas import SCHEMAS, retrieve_custom_schemas, save_custom_schema
from .structured_outputs import prompt_for_structured_output

logger = get_logger(__name__)

logger.debug(f'Known schemas: {list(SCHEMAS.keys())}')


class PromptRequest(BaseModel):
    """Prompt request"""

    prompt: str


app = FastAPI(
    title='structured outputs',
    description='Generate structured outputs from natural language prompts',
    version=VERSION,
)

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
    SCHEMAS.update(retrieve_custom_schemas())
    return {
        name: schema.model_json_schema() for name, schema in SCHEMAS.items()
    }


@app.post('/generate/{schema_name}')
async def generate_structured_output(
    schema_name: str, request: PromptRequest
) -> dict[str, Any]:
    """Generate structured output from a prompt using a specific schema"""
    if schema_name not in SCHEMAS:
        raise HTTPException(
            status_code=404, detail=f'Schema {schema_name} not found'
        )

    schema = SCHEMAS[schema_name]
    result = await prompt_for_structured_output(schema, request.prompt)

    if schema_name == 'NewSchema':
        save_custom_schema(result.model_dump())
        # Refresh schemas after saving a new one
        SCHEMAS.update(retrieve_custom_schemas())

    return result.model_dump()
