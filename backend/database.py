"""Database models for schema storage"""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import (
    Mapped,
    Session,
    mapped_column,
    relationship,
    sessionmaker,
)

from .settings import settings

Base = declarative_base()


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
        DateTime, default=datetime.now(UTC)
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
        back_populates='schema'
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
        DateTime, default=datetime.now(UTC)
    )
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)

    # relationship
    schema: Mapped[Schema] = relationship(back_populates='generations')


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
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
