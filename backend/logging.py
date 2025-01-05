import logging
from functools import lru_cache
from typing import Optional

from rich.console import Console
from rich.logging import RichHandler


def configure_logging() -> None:
    """Configure rich logging with console handler."""
    logger = logging.getLogger('marvin')

    if not logger.handlers:  # only add handler if none exists
        console = Console(force_terminal=True)
        handler = RichHandler(
            console=console,
            show_time=True,
            show_path=False,
            markup=True,
            rich_tracebacks=True,
        )
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)  # this will be overridden by settings


@lru_cache
def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Retrieves a logger with the given name, or the root logger if no name is given.

    Args:
        name: The name of the logger to retrieve.

    Returns:
        The logger with the given name, or the root logger if no name is given.

    Example:
        Basic Usage of `get_logger`
        ```python
        from marvin.utilities.logging import get_logger

        logger = get_logger("marvin.test")
        logger.info("This is a test") # Output: marvin.test: This is a test

        debug_logger = get_logger("marvin.debug")
        debug_logger.debug_kv("TITLE", "log message", "green")
        ```
    """
    # ensure logging is configured
    configure_logging()

    parent_logger = logging.getLogger('marvin')

    if name:
        # Append the name if given but allow explicit full names e.g. "marvin.test"
        # should not become "marvin.marvin.test"
        if not name.startswith(parent_logger.name + '.'):
            logger = parent_logger.getChild(name)
        else:
            logger = logging.getLogger(name)
    else:
        logger = parent_logger

    return logger
