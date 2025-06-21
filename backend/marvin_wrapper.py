"""Wrapper for Marvin operations to handle context variables properly."""

import asyncio
from typing import Any, TypeVar

import marvin
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


async def safe_cast_async(
    data: Any,
    target: type[T],
    instructions: str | None = None,
) -> T:
    """Safely cast data using marvin within the same async context."""
    # Create a new event loop task to ensure we stay in the same context
    task = asyncio.create_task(
        marvin.cast_async(data, target=target, instructions=instructions)
    )
    return await task