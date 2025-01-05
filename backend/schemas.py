"""Schema management"""

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import Schema, get_session, init_db
from .loggers import get_logger

logger = get_logger(__name__)


class SchemaField(BaseModel):
    """A field in a schema"""

    name: str
    type: str
    description: str


class SchemaDefinition(BaseModel):
    """A schema definition"""

    name: str = Field(..., description='like "Location" or "Person" or "Movie"')
    description: str = Field(
        ..., description='a short description of the schema'
    )
    prompt: str = Field(
        ...,
        description='short, friendly buzzfeed headline style question - ultimately prompt them for text to make an instance of this schema',
    )
    fields: list[SchemaField] = Field(
        ...,
        description='list of fields in the schema, each with name, type (string/integer/boolean/number/list/dict), and description',
    )
    is_builtin: bool = False  # default to False for new schemas
    version: int = 1  # default to version 1


# Built-in schemas
BUILTIN_SCHEMAS = {
    'NewSchema': SchemaDefinition(
        name='NewSchema',
        description='Generate a new structured output schema',
        prompt='Describe the schema you want to create (e.g. User, Location, Movie, etc.), what attributes do these things have?',
        fields=[
            SchemaField(
                name='name',
                type='string',
                description='The name of the schema',
            ),
            SchemaField(
                name='description',
                type='string',
                description='A description of what this schema is for',
            ),
            SchemaField(
                name='prompt',
                type='string',
                description='The prompt to show users when using this schema',
            ),
            SchemaField(
                name='fields',
                type='list',
                description='List of fields in the schema. Each field should be a dictionary with name, type (string/integer/boolean/number/list/dict), and description',
            ),
        ],
        is_builtin=True,
    ),
    'WhatPokemonAmI': SchemaDefinition(
        name='WhatPokemonAmI',
        description='A pokemon representative of a personality',
        prompt='Tell me about yourself',
        fields=[
            SchemaField(
                name='name',
                type='string',
                description='The name of the pokemon',
            ),
            SchemaField(
                name='type',
                type='string',
                description='The type of the pokemon',
            ),
            SchemaField(
                name='description',
                type='string',
                description='A short description of the pokemon',
            ),
            SchemaField(
                name='rarity',
                type='string',
                description='The rarity level (common, uncommon, rare, epic, legendary)',
            ),
        ],
    ),
    'SQLQuery': SchemaDefinition(
        name='SQLQuery',
        description='A SQL query from natural language',
        prompt='Describe your desired SQL in natural language',
        fields=[
            SchemaField(
                name='query', type='string', description='The SQL query string'
            ),
            SchemaField(
                name='parameters',
                type='dict',
                description='Optional query parameters',
            ),
        ],
    ),
    'ExecutiveSummary': SchemaDefinition(
        name='ExecutiveSummary',
        description='An executive summary with key points and tags',
        prompt='Enter any text you want to summarize into key points and tags',
        fields=[
            SchemaField(
                name='main_points',
                type='list',
                description='List of key points as short sentences',
            ),
            SchemaField(
                name='tags', type='list', description='List of single-word tags'
            ),
        ],
    ),
}


class SchemaService:
    """Schema management service"""

    def __init__(self):
        """Initialize service"""
        self._init_builtins()

    def _init_builtins(self):
        """Initialize built-in schemas"""
        session = get_session()
        try:
            for name, schema in BUILTIN_SCHEMAS.items():
                # check if schema already exists
                stored = (
                    session.query(Schema)
                    .filter(Schema.name == name, Schema.is_latest)
                    .first()
                )
                if not stored:
                    stored = Schema(
                        name=name,
                        description=schema.description,
                        prompt=schema.prompt,
                        fields=[field.model_dump() for field in schema.fields],
                        is_builtin=True,
                        version=1,
                        is_latest=True,
                    )
                    try:
                        session.add(stored)
                        session.commit()
                    except Exception as e:
                        logger.error(f'Failed to initialize {name}: {e}')
                        session.rollback()
        except Exception as e:
            logger.error(f'Failed to initialize builtins: {e}')
        finally:
            session.close()

    def get_all(self, session: Session) -> dict[str, SchemaDefinition]:
        """Get all latest schema versions"""
        try:
            stmt = select(Schema).where(Schema.is_latest)
            results = session.execute(stmt).scalars().all()
            return {
                schema.name: SchemaDefinition(
                    name=schema.name,
                    description=schema.description,
                    prompt=schema.prompt,
                    fields=[SchemaField(**field) for field in schema.fields],
                    is_builtin=schema.is_builtin,
                    version=schema.version,
                )
                for schema in results
            }
        except Exception as e:
            logger.error(f'Failed to get all schemas: {e}')
            return {}

    def get(self, name: str, session: Session) -> SchemaDefinition | None:
        """Get latest version of a schema by name"""
        try:
            # Ensure tables exist
            init_db()

            stmt = select(Schema).where(Schema.name == name, Schema.is_latest)
            result = session.execute(stmt).scalar_one_or_none()
            if result:
                return SchemaDefinition(
                    name=result.name,
                    description=result.description,
                    prompt=result.prompt,
                    fields=[SchemaField(**field) for field in result.fields],
                    is_builtin=result.is_builtin,
                    version=result.version,
                )
            return None
        except Exception as e:
            logger.error(f'Failed to get schema {name}: {e}')
            return None

    def create(self, schema: SchemaDefinition, session: Session) -> None:
        """Create or update a schema"""
        try:
            # Ensure tables exist
            init_db()

            # get existing latest version
            existing = session.execute(
                select(Schema).where(
                    Schema.name == schema.name, Schema.is_latest
                )
            ).scalar_one_or_none()

            # Convert fields to JSON-serializable format
            serialized_fields = [field.model_dump() for field in schema.fields]

            if existing:
                # Mark current version as not latest
                existing.is_latest = False

                # Create new version
                new_version = Schema(
                    name=schema.name,
                    description=schema.description,
                    prompt=schema.prompt,
                    fields=serialized_fields,
                    is_builtin=existing.is_builtin,
                    version=existing.version + 1,
                    parent_id=existing.id,
                    is_latest=True,
                )
                session.add(new_version)
            else:
                # Create new schema
                new_schema = Schema(
                    name=schema.name,
                    description=schema.description,
                    prompt=schema.prompt,
                    fields=serialized_fields,
                    is_builtin=False,
                    version=1,
                    is_latest=True,
                )
                session.add(new_schema)

            session.commit()
        except Exception as e:
            logger.error(f'Failed to create/update schema {schema.name}: {e}')
            session.rollback()
            raise

    def delete(self, name: str, session: Session) -> None:
        """Delete all versions of a schema"""
        try:
            # Ensure tables exist
            init_db()

            schema = session.execute(
                select(Schema).where(Schema.name == name, Schema.is_latest)
            ).scalar_one_or_none()

            if schema:
                if schema.is_builtin:
                    raise ValueError(f'Cannot delete built-in schema {name}')

                # Delete all versions of this schema
                schemas_to_delete = (
                    session.query(Schema).filter(Schema.name == name).all()
                )
                for schema in schemas_to_delete:
                    session.delete(
                        schema
                    )  # This will cascade delete generations due to relationship config
                session.commit()
            else:
                raise ValueError(f'Schema {name} not found')
        except Exception as e:
            logger.error(f'Failed to delete schema {name}: {e}')
            session.rollback()
            raise


schema_service = SchemaService()
