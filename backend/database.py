"""Database models for schema storage"""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Integer,
    String,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, Session, mapped_column, sessionmaker

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
