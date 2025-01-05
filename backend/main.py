"""Main backend module"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any, Literal

import marvin
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, create_model
from sqlalchemy.orm import Session

from . import VERSION
from .database import Generation, Schema, get_session, init_db
from .loggers import get_logger
from .schemas import SchemaDefinition, SchemaService, schema_service

logger = get_logger(__name__)


class ErrorResponse(BaseModel):
    """Error response"""

    type: Literal[
        'validation_error',
        'not_found',
        'generation_error',
        'database_error',
        'schema_error',
    ]
    message: str
    details: dict[str, Any] | None = None


class PromptRequest(BaseModel):
    """Prompt request"""

    prompt: str


class GenerationResponse(BaseModel):
    """Generation response"""

    id: int
    schema_name: str
    schema_version: int
    prompt: str
    output: dict[str, Any]
    created_at: str
    is_favorite: bool

    model_config = ConfigDict(from_attributes=True)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for FastAPI app"""
    try:
        # Initialize database and builtin schemas
        init_db()
        schema_service._init_builtins()  # type: ignore
        logger.info('Database and builtin schemas initialized')
    except Exception as e:
        logger.error(f'Failed to initialize database: {e}')
    yield


app = FastAPI(
    title='structured outputs',
    description='Generate structured outputs from natural language prompts',
    version=VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Validation exception handler"""
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            type='validation_error',
            message='Invalid request data',
            details={'errors': exc.errors()},
        ).model_dump(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """HTTP exception handler"""
    error_type = 'not_found' if exc.status_code == 404 else 'generation_error'
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            type=error_type,
            message=str(exc.detail),
            details=getattr(exc, 'details', None),
        ).model_dump(),
    )


def get_schema_service() -> SchemaService:
    """Get schema service instance"""
    return schema_service


def get_db():
    """Get database session"""
    db = get_session()
    try:
        yield db
    finally:
        db.close()


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
    db: Session = Depends(get_db),
) -> dict[str, dict[str, Any]]:
    """Get all schemas"""
    schemas = service.get_all(db)
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
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Generate structured output from a prompt"""
    try:
        # Ensure database is initialized
        init_db()

        if not (schema := service.get(schema_name, db)):
            raise HTTPException(
                status_code=404,
                detail=f'Schema {schema_name} not found',
                headers={'X-Error-Type': 'not_found'},
            )

        try:
            if schema_name == 'NewSchema':
                result = await marvin.cast_async(
                    request.prompt,
                    target=SchemaDefinition,
                    instructions=(
                        'the prompt should be short and give a user an understanding of what text they need to provide. '
                        'note that the user does not need to provide all fields, they can give a fuzzy description. '
                        'for fields, return a list of SchemaField objects with name, type, and description. '
                        'type must be one of: string, integer, boolean, number, list, dict. '
                        'ensure each field has a clear, concise description.'
                    ),
                )
                service.create(result, db)
                output = result.model_dump()
            else:
                model = create_pydantic_model(schema)
                result = await marvin.cast_async(request.prompt, target=model)
                output = result.model_dump()

            try:
                # Store the generation in the database
                db_schema = (
                    db.query(Schema)
                    .filter(Schema.name == schema_name, Schema.is_latest)
                    .first()
                )
                if not db_schema:
                    logger.error(
                        f'Schema {schema_name} not found in database after generation'
                    )
                    return output  # Return output even if we can't store it

                generation = Generation(
                    schema_id=db_schema.id,
                    prompt=request.prompt,
                    output=output,
                )
                db.add(generation)
                db.commit()
            except Exception as e:
                logger.error(f'Failed to store generation in database: {e}')
                db.rollback()
                return output  # Return output even if we can't store it

            return output
        except Exception as e:
            logger.error(f'Generation failed: {e}')
            raise HTTPException(
                status_code=500,
                detail='Failed to generate structured output',
                headers={'X-Error-Type': 'generation_error'},
            )
    except Exception as e:
        logger.error(f'Database error in generate endpoint: {e}')
        raise HTTPException(
            status_code=500,
            detail='Database error occurred',
            headers={'X-Error-Type': 'database_error'},
        )


@app.get('/generations/{schema_name}')
def get_generations(
    schema_name: str,
    favorites_only: bool = False,
    db: Session = Depends(get_db),
) -> list[GenerationResponse]:
    """Get generation history for a schema"""
    try:
        # First check if schema exists
        schema = (
            db.query(Schema)
            .filter(Schema.name == schema_name, Schema.is_latest)
            .first()
        )
        if not schema:
            raise HTTPException(
                status_code=404, detail=f'Schema {schema_name} not found'
            )

        # Get all generations for this schema name, including their schema versions
        query = (
            db.query(Generation)
            .join(Schema)
            .filter(Schema.name == schema_name)
            .order_by(Generation.id.desc())
        )

        if favorites_only:
            query = query.filter(Generation.is_favorite)

        generations = query.all()

        return [
            GenerationResponse(
                id=gen.id,
                schema_name=schema_name,
                schema_version=gen.schema.version,
                prompt=gen.prompt,
                output=gen.output,
                created_at=gen.created_at.isoformat(),
                is_favorite=gen.is_favorite,
            )
            for gen in generations
        ]
    except Exception as e:
        logger.error(f'Error getting generations: {e}')
        return []


@app.put('/generations/{generation_id}/favorite')
def toggle_favorite(
    generation_id: int,
    db: Session = Depends(get_db),
) -> GenerationResponse:
    """Toggle favorite status of a generation"""
    generation = (
        db.query(Generation).filter(Generation.id == generation_id).first()
    )
    if not generation:
        raise HTTPException(
            status_code=404,
            detail=f'Generation {generation_id} not found',
        )

    generation.is_favorite = not generation.is_favorite
    db.commit()

    return GenerationResponse(
        id=generation.id,
        schema_name=generation.schema.name,
        schema_version=generation.schema.version,
        prompt=generation.prompt,
        output=generation.output,
        created_at=generation.created_at.isoformat(),
        is_favorite=generation.is_favorite,
    )


@app.delete('/schemas/{schema_name}')
def delete_schema(
    schema_name: str,
    service: SchemaService = Depends(get_schema_service),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Delete a schema"""
    try:
        service.delete(schema_name, db)
        return {'message': f'Schema {schema_name} deleted successfully'}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put('/schemas/{schema_name}')
async def update_schema(
    schema_name: str,
    request: PromptRequest,
    service: SchemaService = Depends(get_schema_service),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Update a schema using AI to transform it"""
    if not (old_schema := service.get(schema_name, db)):
        raise HTTPException(
            status_code=404, detail=f'Schema {schema_name} not found'
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

        # Update schema and create new version
        service.create(updated_schema, db)
        return updated_schema.model_dump()
    except Exception as e:
        logger.error(f'Schema update failed: {e}')
        raise HTTPException(
            status_code=500, detail=f'Failed to update schema: {str(e)}'
        )


@app.delete('/generations/{generation_id}')
def delete_generation(
    generation_id: int,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Delete a generation"""
    generation = (
        db.query(Generation).filter(Generation.id == generation_id).first()
    )
    if not generation:
        raise HTTPException(
            status_code=404, detail=f'Generation {generation_id} not found'
        )

    try:
        db.delete(generation)
        db.commit()
        return {'message': f'Generation {generation_id} deleted successfully'}
    except Exception as e:
        logger.error(f'Failed to delete generation {generation_id}: {e}')
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f'Failed to delete generation: {str(e)}'
        )


@app.get('/schemas/{schema_name}')
def get_schema(
    schema_name: str,
    service: SchemaService = Depends(get_schema_service),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Get a specific schema by name"""
    if not (schema := service.get(schema_name, db)):
        raise HTTPException(
            status_code=404, detail=f'Schema {schema_name} not found'
        )
    return schema.model_dump()


@app.get('/schemas/{schema_name}/versions')
def get_schema_versions(
    schema_name: str,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get version history for a schema"""
    # Get all versions of the schema
    versions = (
        db.query(Schema)
        .filter(Schema.name == schema_name)
        .order_by(Schema.version.desc())
        .all()
    )

    if not versions:
        raise HTTPException(
            status_code=404, detail=f'Schema {schema_name} not found'
        )

    return [
        {
            'id': v.id,
            'version': v.version,
            'description': v.description,
            'prompt': v.prompt,
            'fields': v.fields,
            'parent_version_id': v.parent_id,
            'created_at': v.created_at.isoformat(),
        }
        for v in versions
    ]


@app.get('/generations')
def get_all_generations(
    db: Session = Depends(get_db),
) -> dict[str, list[GenerationResponse]]:
    """Get all generations grouped by schema"""
    try:
        # Get all generations with their schemas
        generations = (
            db.query(Generation)
            .join(Schema)
            .order_by(Generation.id.desc())
            .all()
        )

        # Group generations by schema name
        grouped_generations: dict[str, list[GenerationResponse]] = {}
        for gen in generations:
            schema_name = gen.schema.name
            if schema_name not in grouped_generations:
                grouped_generations[schema_name] = []

            grouped_generations[schema_name].append(
                GenerationResponse(
                    id=gen.id,
                    schema_name=schema_name,
                    schema_version=gen.schema.version,
                    prompt=gen.prompt,
                    output=gen.output,
                    created_at=gen.created_at.isoformat(),
                    is_favorite=gen.is_favorite,
                )
            )

        return grouped_generations
    except Exception as e:
        logger.error(f'Error getting all generations: {e}')
        return {}
