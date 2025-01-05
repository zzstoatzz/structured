"""Database models for schema storage"""

import os
import stat
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    create_engine,
    func,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import (
    Mapped,
    Session,
    mapped_column,
    relationship,
    sessionmaker,
)

from .loggers import get_logger
from .settings import settings

logger = get_logger(__name__)
Base = declarative_base()

# Module-level flag to track initialization
_DB_INITIALIZED = False


class Schema(Base):
    """A schema with version tracking"""

    __tablename__ = 'schemas'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String)
    prompt: Mapped[str] = mapped_column(String)
    fields: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    # Self-referential relationship for versioning
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey('schemas.id'), nullable=True
    )
    parent: Mapped['Schema | None'] = relationship(
        'Schema',
        remote_side=[id],
        backref='versions',
        foreign_keys=[parent_id],
    )

    # Track the latest version for each schema name
    is_latest: Mapped[bool] = mapped_column(Boolean, default=True)

    # generations relationship
    generations: Mapped[list['Generation']] = relationship(
        'Generation', back_populates='schema', cascade='all, delete-orphan'
    )


class Generation(Base):
    """A record of a schema generation"""

    __tablename__ = 'generations'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    schema_id: Mapped[int] = mapped_column(
        ForeignKey('schemas.id'), nullable=False
    )
    prompt: Mapped[str] = mapped_column(String, nullable=False)
    output: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)

    # relationship
    schema: Mapped[Schema] = relationship(back_populates='generations')


def ensure_db_permissions():
    """Ensure database directory and file have correct permissions"""
    db_path = Path(settings.database_url.replace('sqlite:///', ''))

    # Ensure parent directory exists with correct permissions
    db_dir = db_path.parent
    db_dir.mkdir(parents=True, exist_ok=True)

    # Set directory permissions to 755 (rwxr-xr-x)
    os.chmod(
        db_dir,
        stat.S_IRWXU
        | stat.S_IRGRP
        | stat.S_IXGRP
        | stat.S_IROTH
        | stat.S_IXOTH,
    )

    # If database file exists, ensure it has correct permissions (666 rw-rw-rw-)
    if db_path.exists():
        os.chmod(
            db_path,
            stat.S_IRUSR
            | stat.S_IWUSR
            | stat.S_IRGRP
            | stat.S_IWGRP
            | stat.S_IROTH
            | stat.S_IWOTH,
        )

    logger.debug(
        f'Database permissions set for {db_path}'
    )  # Changed to debug level


def get_engine(db_url: str = settings.database_url):
    """Get database engine"""
    return create_engine(db_url)


def get_session() -> Session:
    """Get database session"""
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def init_db() -> None:
    """Initialize database"""
    global _DB_INITIALIZED

    if _DB_INITIALIZED:
        return

    # Only check permissions once during initialization
    ensure_db_permissions()

    engine = get_engine()
    Base.metadata.create_all(bind=engine)

    _DB_INITIALIZED = True
    logger.info('Database initialized')
