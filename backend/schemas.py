"""Schema management"""

from marvin.utilities.logging import get_logger
from pydantic import BaseModel, Field
from sqlalchemy import select

from .database import Schema, get_session, init_db

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
                description='List of fields in the schema, each with name, type (string/integer/boolean/number/list/dict), and description',
            ),
        ],
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
        init_db()
        self.session = get_session()
        self._init_builtins()

    def _init_builtins(self):
        """Initialize built-in schemas"""
        for name, schema in BUILTIN_SCHEMAS.items():
            # check if schema already exists
            if not self.get(name):
                stored = Schema(
                    name=name,
                    description=schema.description,
                    prompt=schema.prompt,
                    fields=[field.model_dump() for field in schema.fields],
                    is_builtin=True,
                )
                try:
                    self.session.add(stored)
                    self.session.commit()
                except Exception as e:
                    logger.error(f'Failed to initialize {name}: {e}')
                    self.session.rollback()

    def get_all(self) -> dict[str, SchemaDefinition]:
        """Get all schemas"""
        stmt = select(Schema)
        results = self.session.execute(stmt).scalars().all()
        return {
            schema.name: SchemaDefinition(
                name=schema.name,
                description=schema.description,
                prompt=schema.prompt,
                fields=[SchemaField(**field) for field in schema.fields],
                is_builtin=schema.is_builtin,
            )
            for schema in results
        }

    def get(self, name: str) -> SchemaDefinition | None:
        """Get a schema by name"""
        stmt = select(Schema).where(Schema.name == name)
        result = self.session.execute(stmt).scalar_one_or_none()
        if result:
            return SchemaDefinition(
                name=result.name,
                description=result.description,
                prompt=result.prompt,
                fields=[SchemaField(**field) for field in result.fields],
            )
        return None

    def create(self, schema: SchemaDefinition) -> None:
        """Create or update a schema"""
        # get existing schema to preserve is_builtin flag
        stmt = select(Schema).where(Schema.name == schema.name)
        existing = self.session.execute(stmt).scalar_one_or_none()

        stored = Schema(
            name=schema.name,
            description=schema.description,
            prompt=schema.prompt,
            fields=[field.model_dump() for field in schema.fields],
            is_builtin=existing.is_builtin if existing else False,
        )

        if existing:
            # Update existing schema
            existing.description = stored.description
            existing.prompt = stored.prompt
            existing.fields = stored.fields
        else:
            # Create new schema
            self.session.add(stored)

        self.session.commit()

    def delete(self, name: str) -> None:
        """Delete a schema"""
        stmt = select(Schema).where(Schema.name == name)
        schema = self.session.execute(stmt).scalar_one_or_none()
        if schema:
            if schema.is_builtin:
                raise ValueError(f'Cannot delete built-in schema {name}')
            self.session.delete(schema)
            self.session.commit()


schema_service = SchemaService()
