"""Schemas for the backend"""

import inspect
from datetime import datetime
from typing import Annotated, Any, ClassVar, TypedDict

from pydantic import BaseModel, ConfigDict, Field, create_model
from pydantic_core import from_json, to_json

from .settings import settings


class _Schema(BaseModel): ...


TYPE_MAP: dict[str, type] = {
    'string': str,
    'integer': int,
    'boolean': bool,
    'float': float,
    'list': list,
    'dict': dict,
    'datetime': datetime,
    'number': float,
    'date': datetime,
    'object': dict,
}


class SchemaField(TypedDict):
    """a field in a schema"""

    name: str
    type: str
    description: str


def json_schema_to_internal(json_schema: dict[str, Any]) -> dict[str, Any]:
    """Convert JSON schema format to our internal format"""
    return {
        'name': json_schema['title'],
        'description': json_schema['prompt'],
        'fields': [
            {
                'name': name,
                'type': props['type'],
                'description': props['description'],
            }
            for name, props in json_schema['properties'].items()
        ],
    }


def create_model_from_schema(schema: dict[str, Any]) -> type[BaseModel]:
    """Create a Pydantic model from a schema"""
    field_definitions: dict[str, Any] = {}

    for field in schema['fields']:
        # convert type string to actual type if possible
        field_type = TYPE_MAP.get(field['type'].lower(), field['type'])

        field_definitions[field['name']] = (
            field_type,
            Field(description=field['description']),
        )

    custom_model = create_model(schema['name'], **field_definitions)
    custom_model.model_config = ConfigDict(
        title=schema['name'],
        json_schema_extra={
            'prompt': 'Provide text to structure as a '
            + schema['name']
            + ' object',
            'example': schema.get('example'),
        },
    )
    return custom_model


def save_custom_schema(schema: dict[str, Any]) -> None:
    """Save a custom schema to disk"""
    custom_model = create_model_from_schema(schema)
    (settings.custom_schema_storage / f"{schema['name']}.json").write_bytes(
        to_json(custom_model.model_json_schema())
    )


def delete_custom_schema(schema_name: str) -> None:
    """Delete a custom schema from disk"""
    schema_path = settings.custom_schema_storage / f'{schema_name}.json'
    if schema_path.exists():
        schema_path.unlink()
    else:
        raise FileNotFoundError(f'Schema {schema_name} not found')


def retrieve_custom_schemas() -> dict[str, type[BaseModel]]:
    """Retrieve all custom schemas from disk"""
    return {
        path.stem: create_model_from_schema(
            json_schema_to_internal(from_json(path.read_bytes()))
        )
        for path in settings.custom_schema_storage.glob('*.json')
    }


class SQLQuery(_Schema):
    """a query and optional parameters"""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        title='SQL Query',
        json_schema_extra={
            'prompt': 'Describe in natural language what data you want'
        },
    )

    query: str = Field(description='The SQL query string')
    parameters: dict[str, Any] | None = Field(
        default=None, description='Optional query parameters'
    )


class ExecutiveSummary(_Schema):
    """an executive summary of some text with main points and tags"""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        json_schema_extra={
            'title': 'Executive Summary',
            'prompt': 'Enter any text you want to summarize into key points and tags',
        },
    )

    main_points: list[Annotated[str, Field(description='a short sentence')]]
    tags: list[Annotated[str, Field(description='a single word')]]


class SchemaFields(BaseModel):
    """a list of fields in a schema"""

    fields: list[SchemaField] = Field(default_factory=list)


class NewSchema(_Schema):
    """generate a new schema from natural language description"""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        title='New Schema',
        json_schema_extra={
            'prompt': 'Describe the structure and fields you want in your schema',
        },
    )

    name: str = Field(description='The name of the schema (PascalCase)')
    description: str = Field(
        description='A brief description of what this schema represents'
    )
    fields: list[SchemaField] = Field(
        description='List of field definitions. Each field must have name, type, and description.',
        default_factory=list,
    )


assert NewSchema.__doc__ is not None, 'pigs are flying'
NewSchema.__doc__ += f"""\n\nYou may only use the following types: {', '.join(TYPE_MAP.keys())}"""


SCHEMAS: dict[str, type[BaseModel]] = {
    k: v
    for k, v in globals().items()
    if inspect.isclass(v) and issubclass(v, _Schema) and v is not _Schema
}
