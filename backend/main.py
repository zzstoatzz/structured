"""Main backend module"""

from typing import Any

import marvin
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, create_model

from . import VERSION
from .logging import get_logger
from .schemas import (
    BUILTIN_SCHEMAS,
    SchemaDefinition,
    SchemaService,
    schema_service,
)

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


def get_schema_service() -> SchemaService:
    """Get schema service instance"""
    return schema_service


def create_pydantic_model(schema: SchemaDefinition) -> type[BaseModel]:
    """Create a Pydantic model from a schema definition"""
    fields: dict[str, Any] = {}
    for field in schema.fields:
        python_type = {
            'string': str,
            'integer': int,
            'boolean': bool,
            'number': float,
            'list': list,
            'dict': dict,
        }.get(field.type, str)

        fields[field.name] = (python_type, Field(description=field.description))

    return create_model(
        schema.name, **fields, __config__=ConfigDict(title=schema.name)
    )


@app.get('/schemas')
def get_schemas(
    service: SchemaService = Depends(get_schema_service),
) -> dict[str, dict[str, Any]]:
    """Get all schemas"""
    schemas = service.get_all()
    return {
        name: {
            'title': schema.name,
            'description': schema.description,
            'prompt': schema.prompt,
            'is_builtin': schema.is_builtin,
            'properties': {
                field.name: {
                    'type': field.type,
                    'description': field.description,
                }
                for field in schema.fields
            },
        }
        for name, schema in schemas.items()
    }


@app.post('/generate/{schema_name}')
async def generate_structured_output(
    schema_name: str,
    request: PromptRequest,
    service: SchemaService = Depends(get_schema_service),
) -> dict[str, Any]:
    """Generate structured output from a prompt"""
    if schema_name == 'NewSchema':
        new_schema = await marvin.cast_async(
            request.prompt,
            target=SchemaDefinition,
            instructions=(
                'the prompt should be short and give a user an understanding of what text they need to provide. '
                'note that the user does not need to provide all fields, they can give a fuzzy description'
            ),
        )
        service.create(new_schema)
        return new_schema.model_dump()

    if not (schema := service.get(schema_name)):
        raise HTTPException(
            status_code=404, detail=f'Schema {schema_name} not found'
        )

    model = create_pydantic_model(schema)
    try:
        result = await marvin.cast_async(request.prompt, target=model)
        return result.model_dump()
    except Exception as e:
        logger.error(f'Generation failed: {e}')
        raise HTTPException(
            status_code=500, detail=f'Failed to generate output: {str(e)}'
        )


@app.delete('/schemas/{schema_name}')
def delete_schema(
    schema_name: str, service: SchemaService = Depends(get_schema_service)
) -> dict[str, str]:
    """Delete a schema"""
    try:
        service.delete(schema_name)
        return {'message': f'Schema {schema_name} deleted successfully'}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put('/schemas/{schema_name}')
async def update_schema(
    schema_name: str,
    request: PromptRequest,
    service: SchemaService = Depends(get_schema_service),
) -> dict[str, Any]:
    """Update a schema using AI to transform it"""
    if not (old_schema := service.get(schema_name)):
        raise HTTPException(
            status_code=404, detail=f'Schema {schema_name} not found'
        )

    if schema_name in BUILTIN_SCHEMAS:
        raise HTTPException(
            status_code=400,
            detail=f'Cannot modify builtin schema {schema_name}',
        )

    try:
        logger.info(
            f'Updating schema {schema_name} with prompt: {request.prompt}'
        )
        # Transform the schema but preserve the original name
        updated_schema = await marvin.cast_async(
            old_schema,
            SchemaDefinition,
            instructions=f"{request.prompt} - keep the name as '{schema_name}'",
        )
        updated_schema.name = schema_name  # ensure name stays the same
        service.create(updated_schema)  # create will update if exists
        return updated_schema.model_dump()
    except Exception as e:
        logger.error(f'Schema update failed: {e}')
        raise HTTPException(
            status_code=500, detail=f'Failed to update schema: {str(e)}'
        )
