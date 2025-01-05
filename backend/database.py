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
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship, sessionmaker

from .settings import settings

Base = declarative_base()


class Schema(Base):
    """A stored schema"""

    __tablename__ = 'schemas'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String)
    prompt: Mapped[str] = mapped_column(String)
    fields: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(UTC),
        onupdate=datetime.now(UTC),
    )
    current_version_id: Mapped[int | None] = mapped_column(
        ForeignKey('schema_versions.id'), nullable=True
    )
    # Add relationships
    generations: Mapped[list["Generation"]] = relationship(back_populates="schema")
    versions: Mapped[list["SchemaVersion"]] = relationship(
        back_populates="schema",
        foreign_keys="SchemaVersion.schema_id",
        overlaps="current_version"
    )
    current_version: Mapped["SchemaVersion | None"] = relationship(
        foreign_keys=[current_version_id],
        overlaps="versions"
    )


class SchemaVersion(Base):
    """A version of a schema"""

    __tablename__ = 'schema_versions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    schema_id: Mapped[int] = mapped_column(ForeignKey('schemas.id'), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(String)
    prompt: Mapped[str] = mapped_column(String)
    fields: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)
    parent_version_id: Mapped[int | None] = mapped_column(
        ForeignKey('schema_versions.id'), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(UTC))
    
    # relationships
    schema: Mapped["Schema"] = relationship(
        back_populates="versions",
        foreign_keys=[schema_id],
        overlaps="current_version"
    )
    parent_version: Mapped["SchemaVersion | None"] = relationship(
        "SchemaVersion",
        remote_side=[id],
        backref="child_versions",
        foreign_keys=[parent_version_id]
    )


class Generation(Base):
    """A record of a schema generation"""

    __tablename__ = 'generations'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    schema_id: Mapped[int] = mapped_column(ForeignKey('schemas.id'), nullable=False)
    schema_version_id: Mapped[int] = mapped_column(ForeignKey('schema_versions.id'), nullable=False)
    prompt: Mapped[str] = mapped_column(String, nullable=False)
    output: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now(UTC)
    )
    # Add relationships
    schema: Mapped[Schema] = relationship(back_populates="generations")
    schema_version: Mapped[SchemaVersion] = relationship()


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
