"""Main backend module"""

from typing import Any

import marvin
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import VERSION
from .logging import get_logger
from .schemas import SchemaService, schema_service

logger = get_logger(__name__)


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


async def get_schema_service() -> SchemaService:
    """Dependency to get schema service"""
    return schema_service


@app.get('/schemas')
async def get_schemas(
    service: SchemaService = Depends(get_schema_service),
) -> dict[str, dict[str, Any]]:
    """Get all the schemas"""
    schemas = await service.get_all()
    return {
        name: schema.model_json_schema() for name, schema in schemas.items()
    }


@app.post('/generate/{schema_name}')
async def generate_structured_output(
    schema_name: str,
    request: PromptRequest,
    service: SchemaService = Depends(get_schema_service),
) -> dict[str, Any]:
    """Generate structured output from a prompt using a specific schema"""
    schema = await service.get(schema_name)
    if not schema:
        raise HTTPException(
            status_code=404, detail=f'Schema {schema_name} not found'
        )

    result = await marvin.cast_async(request.prompt, target=schema)

    if schema_name == 'NewSchema':
        await service.save_custom(result.model_dump())

    return result.model_dump()


@app.delete('/schemas/{schema_name}')
async def delete_schema(
    schema_name: str, service: SchemaService = Depends(get_schema_service)
) -> dict[str, str]:
    """Delete a custom schema"""
    try:
        await service.delete(schema_name)
        return {'message': f'Schema {schema_name} deleted successfully'}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail=f'Schema {schema_name} not found'
        )
