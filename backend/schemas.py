"""Schemas for the backend"""

from typing import Any

from pydantic import BaseModel, Field


class SQLQuery(BaseModel):
    """a SQL query and optional parameters"""

    query: str = Field(description='The SQL query string')
    parameters: dict[str, Any] | None = Field(default=None, description='Optional query parameters')


class APIRoute(BaseModel):
    """a FastAPI route and optional parameters"""

    path: str = Field(description='The route path')
    method: str = Field(description='HTTP method')
    parameters: list[dict[str, Any]] = Field(default_factory=list, description='Route parameters')
    response_model: dict[str, Any] | None = Field(default=None, description='Response schema')


class JSONSchema(BaseModel):
    """a JSON schema definition"""

    type: str = Field(description='JSON schema type')
    properties: dict[str, Any] = Field(description='Schema properties')
    required: list[str] | None = Field(default=None, description='Required properties')


SCHEMAS: dict[str, type[BaseModel]] = {
    'SQL Query': SQLQuery,
    'API Route': APIRoute,
    'JSON Schema': JSONSchema,
}
