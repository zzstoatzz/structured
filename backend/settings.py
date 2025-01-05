"""Settings"""

import importlib
from typing import ClassVar, Literal, Self

from pydantic import model_validator
from pydantic_ai.models import KnownModelName
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings"""

    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file='.env', extra='ignore'
    )

    llm_model: KnownModelName = 'openai:gpt-4'
    """LLM model to use"""

    log_level: Literal['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] = 'INFO'
    """Log level"""

    database_url: str = 'sqlite:///./schemas.db'
    """Database URL"""

    @model_validator(mode='after')
    def validate_llm_deps_installed(self) -> Self:
        """Validate that the LLM model is installed"""
        if self.llm_model.startswith('openai:'):
            try:
                importlib.import_module('openai')
            except ImportError:
                raise ValueError(
                    f'`uv pip install openai` to use {self.llm_model}'
                )
        return self

    @model_validator(mode='after')
    def setup_logging(self) -> Self:
        """Setup logging"""
        from .logging import get_logger

        logger = get_logger(__name__)
        logger.setLevel(self.log_level)
        logger.info(f'settings initialized: {self.model_dump_json(indent=2)}')
        return self


settings = Settings()
