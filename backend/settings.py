"""Settings"""

import importlib
from pathlib import Path
from typing import ClassVar, Self

from pydantic import model_validator
from pydantic_ai.models import KnownModelName
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings"""

    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file='.env'
    )

    llm_model: KnownModelName = 'openai:gpt-4o'
    """LLM model to use"""

    log_level: str = 'INFO'
    """Log level"""

    custom_schema_storage: Path = Path(
        '~/.structured_outputs/custom_schemas'
    ).expanduser()
    """Directory to store custom schemas"""

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
        """Finalize the settings."""
        from .logging import get_logger, setup_logging

        setup_logging(self.log_level)

        logger = get_logger(__name__)
        logger.debug(f'Settings initialized: {self.model_dump_json(indent=2)}')

        return self

    @model_validator(mode='after')
    def setup_custom_schema_storage(self) -> Self:
        """Setup the custom schema storage"""
        self.custom_schema_storage.mkdir(parents=True, exist_ok=True)
        return self


settings = Settings()
