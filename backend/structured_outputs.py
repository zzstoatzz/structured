"""Structured outputs"""

from typing import Any

from pydantic_ai import Agent

from .logging import get_logger
from .settings import settings

logger = get_logger(__name__)

_AGENT_CACHE: dict[type[Any], Agent[None, Any]] = {}


def create_agent[T](result_type: type[T]) -> Agent[None, T]:
    """Create an agent for generating structured outputs"""
    if (cached_agent := _AGENT_CACHE.get(result_type)) is not None:
        logger.debug(f'Using cached agent for {result_type}')
        return cached_agent

    logger.debug(f'Creating new agent for {result_type}')
    agent = Agent[None, T](
        model=settings.llm_model,
        system_prompt='Cast inputs to the result format concisely',
        result_type=result_type,
    )
    _AGENT_CACHE[result_type] = agent
    return agent


async def prompt_for_structured_output[T](result_type: type[T], prompt: str) -> T:
    """Prompt for structured output"""
    logger.debug(f'Prompting for structured output: {prompt}')
    result = await create_agent(result_type).run(prompt)
    logger.debug(f'Result: {result.data}')
    return result.data
